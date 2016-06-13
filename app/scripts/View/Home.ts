﻿/// <reference path="../include/interfaces.d.ts" />
/// <reference path="../../modules/include/jquery.d.ts" />

module Garage {
	export module View {

		import Framework = CDP.Framework;
		import Tools = CDP.Tools;
		import UI = CDP.UI;

		var TAG: string = "[Garage.View.Home] ";

		/**
		 * @class Home
		 * @brief Home View class for Garage.
		 */
		class Home extends UI.PageView<Backbone.Model> {
			private currentWindow_: any;
			private contextMenu_: any;
			private rightClickPosition_: { x: number; y: number };

			private HISTORY_COUNT = 5;

			/**
			 * construnctor
			 */
			constructor() {
				super("/templates/home.html", "page-home", { route: "home" });
			}

			///////////////////////////////////////////////////////////////////////
			// Override: UI.PageView

			//! page initialization event
			onInitialize(event: JQueryEventObject): void {
                super.onInitialize(event);
			}

			//! page show event
			onPageShow(event: JQueryEventObject, data?: Framework.ShowEventData): void {
				super.onPageShow(event, data);

                this._initializeHomeView();
                (function loop() {
                    setTimeout(loop, 5000);
                    if (!fs.existsSync(HUIS_ROOT_PATH)) {
                        electronDialog.showMessageBox({
                            type: "error",
                            message: "HUISが切断されました。アプリを終了します。",
                            buttons: ["ok"]
                        });
                        app.quit();
                    }
                })();

			}

			//! page before hide event
			onPageBeforeHide(event: JQueryEventObject, data?: Framework.HideEventData) {
				$(window).off("resize", this._pageLayout);
				let $faceContainer = $(".face-container");
				$faceContainer.off("click");

				super.onPageBeforeHide(event, data);
			}

			//! events binding
			events(): any {
				return {
					"dblclick header .ui-title": "_onHeaderDblClick",
					"click #create-new-remote": "_onCreateNewRemote",
                    "click #sync-pc-to-huis": "_onSyncPcToHuisClick",
                    "click #option-pulldown-menu": "_onOptionPullDownMenuClick",
					// コンテキストメニュー
                    "contextmenu": "_onContextMenu",
                    // プルダウンメニューのリスト
                    "vclick #command-about-this": "_onCommandAboutThis",
                    "vclick #command-visit-help": "_onCommandVisitHelp",
				};
			}

			render(): Home {
				this._renderFaceList();
				//this._renderFaceHistory();
				return this;
			}

			/**
			 * Home 画面の初期化
			 */
			private _initializeHomeView() {
				// HUIS ファイルを再読み込みする
				// [TODO] 変更があったときのみ再読み込みすべき
				huisFiles.init(HUIS_FILES_ROOT);

				this._pageLayout();
				this.render();

				$(window).on("resize", this._pageLayout);

				this.currentWindow_ = Remote.getCurrentWindow();
				// コンテキストメニュー
                this.contextMenu_ = new Menu();
			}

			/**
			 * face リストのレンダリング
			 */
			private _renderFaceList() {
				var templateFile = Framework.toUrl("/templates/home.html");
				var faceItemTemplate = Tools.Template.getJST("#face-list-template", templateFile);

				// HuisFiles から フルカスタムの face を取得。
				// face は新しいものから表示するため、取得した facelist を逆順にする。
				var faces = huisFiles.getFilteredFacesByCategories({ matchingCategories: ["fullcustom"] }).reverse();
				var faceList: { remoteId: string, name: string }[] = [];
				faces.forEach((face: IGFace) => {
					faceList.push({
						remoteId: face.remoteId,
						name: face.name
					});
				});

				var $faceList = $("#face-list");
				$faceList.append($(faceItemTemplate({ faceList: faceList })));
				var elems: any = $faceList.children();
				for (let i = 0, l = elems.length; i < l; i++) {
					this._renderFace($(elems[i]));
				}
				this._calculateFaceListWidth();
			}

			/**
			 * 編集した face のヒストリーをレンダリング
			 */
			private _renderFaceHistory() {
				var templateFile = Framework.toUrl("/templates/home.html");
				var faceItemTemplate = Tools.Template.getJST("#face-list-template", templateFile);

				// deviceId は暫定
				var deviceId = "dev";
				var faceHistory = garageFiles.getHistoryOfEditedFaces(deviceId);
				if (!faceHistory) {
					return;
				}

				var faces: IGFace[] = [];
				faceHistory.forEach((remoteId, index) => {
					let face: IGFace = huisFiles.getFace(remoteId.remote_id);
					if (face && index < this.HISTORY_COUNT) {
						faces.push(face);
					}
				});

				var faceList: { remoteId: string, name: string }[] = [];
				faces.forEach((face: IGFace) => {
					faceList.push({
						remoteId: face.remoteId,
						name: face.name
					});
				});

				var $faceHistoryList = $("#face-history-list");
				$faceHistoryList.append($(faceItemTemplate({ faceList: faceList })));
				var elems: JQuery = $faceHistoryList.children();
				var list_width = 0;
				for (let i = 0, l = elems.length; i < l && i < this.HISTORY_COUNT; i++) {
					this._renderFace($(elems[i]));
					list_width += $(elems[i]).outerWidth(true);
				}
				$faceHistoryList.width(list_width);
			}

			private _renderFace($face: JQuery): void {
				var remoteId = $face.attr("data-remoteId");
				if (!remoteId) {
					return;
				}
				var face: IGFace = huisFiles.getFace(remoteId);
				var faceRenderer: FaceRenderer = new FaceRenderer({
					el: $face.find(".face-container"),
					attributes: {
						face: face,
						materialsRootPath: HUIS_FILES_ROOT
					}
				});
				faceRenderer.render();

                /*
				// サイズを調整
				let $faceContainer = $face.find(".face-container");
				let $faceCanvas = $face.find("#face-pages-area");
				//let adjustedHeightRate = $face.height() / $faceCanvas.innerHeight();
                
				let adjustedWidthRate = $face.width() / $faceCanvas.innerWidth();
				$faceCanvas.css({
					"transform": "scale(" + adjustedWidthRate + ")",
					"transform-origin": "left top",
				});
				let adjsutedFaceHeight = $faceCanvas.innerHeight() * adjustedWidthRate;
				$faceContainer.width($face.width());
				$faceContainer.height(adjsutedFaceHeight);
                */

				// クリックしたら編集画面への遷移できるようにする
                $face.find(".face-container").on("click", (event) => {
					let $clickedFace = $(event.currentTarget);
                    let remoteId = $clickedFace.data("remoteid");
					if (remoteId) {
						Framework.Router.navigate("#full-custom?remoteId=" + remoteId);
					}
				});
			}

			private _onHeaderDblClick() {
				var currentWindow = Remote.getCurrentWindow();
				if (currentWindow.isDevToolsOpened()) {
					Framework.Router.navigate("#face-render-experiment");
				} else {
					currentWindow.toggleDevTools();
				}
			}

			private _onCreateNewRemote() {
				if (huisFiles.canCreateNewRemote()) {
					Framework.Router.navigate("#full-custom");
				} else {
					electronDialog.showMessageBox({
						type: "error",
						message: "リモコンの上限数に達しているため、リモコンを作成できません。\n"
						+ "リモコンの上限数は " + MAX_HUIS_FILES + " です。\n"
						+ "これは機器リモコンやカスタムリモコン等を含めた数です。",
						buttons: ["ok"]
					});
				}
			}

			private _onSyncPcToHuisClick() {
				let response = electronDialog.showMessageBox({
					type: "info",
					message: "変更内容を HUIS に反映しますか？\n"
					+ "最初に接続した HUIS と異なる HUIS を接続している場合、\n"
					+ "HUIS 内のコンテンツが上書きされますので、ご注意ください。",
					buttons: ["yes", "no"]
				});
				if (response !== 0) {
					return;
				}

				huisFiles.updateRemoteList();
				if (HUIS_ROOT_PATH) {
					let syncTask = new Util.HuisDev.FileSyncTask();
					syncTask.exec(HUIS_FILES_ROOT, HUIS_ROOT_PATH, DIALOG_PROPS_SYNC_FROM_PC_TO_HUIS, (err) => {
						if (err) {
							// [TODO] エラー値のハンドリング
							electronDialog.showMessageBox({
								type: "error",
								message: "HUIS と同期できませんでした。\n"
								+ "HUIS が PC と接続されていない可能性があります。\n"
								+ "HUIS が PC に接続されていることを確認して、再度同期をお試しください。",
								buttons: ["ok"]
							});
						} else {
							CDP.UI.Toast.show("HUIS との同期が完了しました。");
						}
					});
				}
            }

            /*
             * プルダウンメニュー対応
             */

            private _onOptionPullDownMenuClick() {
                var $overflow = this.$page.find("#option-pulldown-menu-popup"); // ポップアップのjQuery DOMを取得
                var $button1 = this.$page.find("#option-pulldown-menu");
                
                var options: PopupOptions = {
                    x: $button1.offset().left,
                    y: $button1.height(),
                    positionTo: "origin",
                    corners: false
                };
                $overflow.popup(options).popup("open").on("vclick", () => {
                    $overflow.popup("close");
                });
                return;
            }

            private _onCommandAboutThis() {
                var options: Util.ElectronMessageBoxOptions = {
                    type: "info",
                    message: "HUIS UI Creator (c) 2016 Sony Corporation",
                    buttons: [
                        "OK"
                    ],
                };
                electronDialog.showMessageBox(options);
                return;
            }

            private _onCommandVisitHelp() {
                var shell = require('electron').shell;
                shell.openExternal(HELP_SITE_URL);
                return;
            }

			private _onContextMenu() {
				event.preventDefault();
				this.rightClickPosition_ = {
					x: event.pageX,
					y: event.pageY
				};

				// コンテキストメニューを作成する
				this.contextMenu_.clear();

				var menuItem_inspectElement = new MenuItem({
					label: "要素を検証",
					click: () => {
						this.currentWindow_.inspectElement(this.rightClickPosition_.x, this.rightClickPosition_.y);
					}
				});

				var element = document.elementFromPoint(event.pageX, event.pageY);
				var $face = $(element).parents("#face-list .face");
				if ($face.length) {
					let remoteId = $face.data("remoteid");
					if (remoteId) {
						this.contextMenu_.append(new MenuItem({
							label: "このリモコン (" + remoteId + ") を削除",
							click: () => {
								this._removeFace(remoteId);
							}
						}));
					}
				}

				this.contextMenu_.append(menuItem_inspectElement);

				this.contextMenu_.popup(this.currentWindow_);
			}

			private _pageLayout() {
				var windowWidth = innerWidth;
				var windowHeight = innerHeight;

				//var faceHistoryListContainerHeight = 200; // tentative
                var faceHistoryListContainerHeight = 0; // ヒストリー表示がなくなったので、暫定的にサイズ 0
                var scrollHeight = windowHeight - $(window).outerHeight(true);
                var faceListContainerHeight = innerHeight - $("#face-list-container").offset().top - faceHistoryListContainerHeight - scrollHeight;
				//if (faceListContainerHeight < 200) {s
				//	faceListContainerHeight = 200;
				//}
			    $("#face-list").css("height", faceListContainerHeight + "px");
			}

			/**
			 * faceList の width を計算して設定する
			 */
			private _calculateFaceListWidth() {
				let $faceList = $("#face-list");
                let $items = $faceList.find(".face");
				let listWidth = 0;
                $items.each((index, item) => {
                    listWidth += $(item).outerWidth(true);
				});
                $faceList.width(listWidth);
			}

			private _removeFace(remoteId: string) {
				huisFiles.removeFace(remoteId);
				$(".face[data-remoteid=" + remoteId + "]").remove();
				this._calculateFaceListWidth();
			}

		}

		var View = new Home();
	}
}