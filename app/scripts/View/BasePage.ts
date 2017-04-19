﻿/*
    Copyright 2016 Sony Corporation

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/

/// <reference path="../include/interfaces.d.ts" />
/// <reference path="../../modules/include/jquery.d.ts" />

module Garage {
    export module View {

        import Framework = CDP.Framework;
        import Tools = CDP.Tools;
        import UI = CDP.UI;
        import Dialog = CDP.UI.Dialog;
        import DialogOptions = CDP.UI.DialogOptions;
        import JQUtils = Util.JQueryUtils;
        import ZipManager = Util.ZipManager;

        let TAG_BASE: string = "[Garage.View.BasePage] ";

        /**
         * @class StyleBuilderDefault
         * @brief スタイル変更時に使用する既定の構造体オブジェクト
         */
        class StyleBuilderDefault implements UI.Toast.StyleBuilder {

            //! class attribute に設定する文字列を取得
            getClass(): string {
                return "ui-loader ui-overlay-shadow ui-corner-all ui-body-b";
            }

            //! style attribute に設定する JSON オブジェクトを取得
            getStyle(): any {
                let style = {
                    "display": "block",
                    "opacity": 1
                };
                return style;
            }

            //! オフセットの基準位置を取得
            getOffsetPoint(): number {
                //! @enum オフセットの基準
                enum OffsetX {
                    LEFT = 0x0001,
                    RIGHT = 0x0002,
                    CENTER = 0x0004,
                }

                //! @enum オフセットの基準
                enum OffsetY {
                    TOP = 0x0010,
                    BOTTOM = 0x0020,
                    CENTER = 0x0040,
                }

                return OffsetX.CENTER | OffsetY.TOP;
            }

            //! X 座標のオフセット値を取得
            getOffsetX(): number {
                return 0;
            }

            //! Y 座標のオフセット値を取得
            getOffsetY(): number {
                return 87;
            }
        }

        /**
         * @class Home
         * @brief Home View class for Garage.
        */
        export class BasePage extends UI.PageView<Backbone.Model> {

            protected currentWindow_: any;
            protected contextMenu_: any;
            protected rightClickPosition_ = new Model.Position(0, 0);

            constructor(html, name, options) {
                super(html, name, options);

                //完了時のダイアログのアイコンのパス
                var PATH_IMG_DIALOG_DONE_ICON = 'url("../res/images/icon_done.png")';
                let dialogMessageStr :string= "dialog.message.";

                // 同期 (HUIS -> PC) ダイアログのパラメーター 完了
                DIALOG_PROPS_CREATE_NEW_REMOTE = {
                    id: "#common-dialog-spinner",
                    options: {
                        title: $.i18n.t(dialogMessageStr + "STR_GARAGE_DIALOG_MESSAGE_IN_SYNCING"),
                        anotherOption: {
                            title: $.i18n.t(dialogMessageStr + "STR_GARAGE_DIALOG_MESSAGE_SYNC_DONE"),
                            src: PATH_IMG_DIALOG_DONE_ICON,
                        }
                    }
                }

                DIALOG_PROPS_COPY_AND_EDIT_REMOTE = {
                    id: "#common-dialog-spinner",
                    options: {
                        title: $.i18n.t(dialogMessageStr + "STR_GARAGE_DIALOG_MESSAGE_IN_COPYING"),
                        anotherOption: {
                            title: $.i18n.t(dialogMessageStr + "STR_GARAGE_DIALOG_MESSAGE_COPY_DONE_ENTER_FULLCUSTOM"),
                            src: PATH_IMG_DIALOG_DONE_ICON,
                        }
                    }
                }

                // 同期 (HUIS -> PC) ダイアログのパラメーター 完了文言
                DIALOG_PROPS_DELTE_REMOTE = {
                    id: "#common-dialog-spinner",
                    options: {
                        title: $.i18n.t(dialogMessageStr + "STR_GARAGE_DIALOG_MESSAGE_IN_DELETEING"),
                        anotherOption: {
                            title: $.i18n.t(dialogMessageStr + "STR_GARAGE_DIALOG_MESSAGE_DELETE_DONE"),
                            src: PATH_IMG_DIALOG_DONE_ICON,
                        }
                    }
                }

                // 同期 (HUIS -> PC) ダイアログのパラメーター 完了文言
                DIALOG_PROPS_SYNC_FROM_PC_TO_HUIS_WITH_DONE = {
                    id: "#common-dialog-spinner",
                    options: {
                        title: $.i18n.t(dialogMessageStr + "STR_GARAGE_DIALOG_MESSAGE_IN_SYNCING"),
                        anotherOption: {
                            title: $.i18n.t(dialogMessageStr + "STR_GARAGE_DIALOG_MESSAGE_SYNC_DONE"),
                            src: PATH_IMG_DIALOG_DONE_ICON,
                        }
                    }
                }

                // 同期 (HUIS -> PC) ダイアログのパラメーター 
                DIALOG_PROPS_SYNC_FROM_HUIS_TO_PC = {
                    id: "#common-dialog-spinner",
                    options: {
                        title: $.i18n.t(dialogMessageStr + "STR_GARAGE_DIALOG_MESSAGE_IN_SYNCING"),
                    }
                };

                // 同期 (PC -> HUIS) ダイアログのパラメーター 
                DIALOG_PROPS_SYNC_FROM_PC_TO_HUIS = {
                    id: "#common-dialog-spinner",
                    options: {
                        "message": $.i18n.t(dialogMessageStr + "STR_GARAGE_DIALOG_MESSAGE_IN_SYNCING")
                    }
                };

                // PC と HUIS とのファイル差分チェックダイアログのパラメーター (現在は使われていない)
                DIALOG_PROPS_CHECK_DIFF = {
                    id: "#common-dialog-spinner",
                    options: {
                        "title": "★PC のファイルと HUIS のファイルの差分を確認中です。\nHUIS と PC との接続を解除しないでください。"
                    }
                };

            }

            onPageShow(event: JQueryEventObject, data?: Framework.ShowEventData): void {
                // Drag and Dropで反応するのを抑制する
                document.addEventListener('dragover', function (event) {
                    event.preventDefault();
                    return false;
                }, false);

                document.addEventListener('drop', function (event) {
                    event.preventDefault();
                    return false;
                }, false);

            }

            events(): any {  // 共通のイベント
                return {
                    // プルダウンメニューのリスト
                    "vclick #command-about-this": "_onCommandAboutThis",
                    "vclick #command-visit-help": "_onCommandVisitHelp",
                };
            }

            // ドロップダウンメニューから起動される共通の関数
            private _onCommandAboutThis() {
                var dialog: View.VersionDialog = null;
                var props: DialogProps = null;
                var text: string = "";

                let licensesFilePath = miscUtil.getAppropriatePath(CDP.Framework.toUrl("/res/license/licenses.txt"));
                try {
                    text = fs.readFileSync(licensesFilePath, 'utf8');
                } catch (err) {
                    console.error(err);
                }

                dialog = new VersionDialog({ el: $('body') });

                //ダイアログの中身のテキストをローカライズ
                $("#about-app-name").text($.i18n.t("app.name"));
                $("#about-version-info").find(".label").text($.i18n.t("about.STR_ABOUT_TEXT_VERSION"));
                $("#about-copyright").text($.i18n.t("about.STR_ABOUT_TEXT_COPYRIGHT"));
                $("#dialog-about-message-container").html(text);
                $("#about-version-number").text(APP_VERSION);


                //エレクトロンのラインセンス情報を記載したファイルパス
                let pathElectronLicensesFile = miscUtil.getAppropriatePath(CDP.Framework.toUrl("/res/license/LICENSES.chromium.html"));
                //licenses.txt上の リンクを有効なパスに更新する。
                $("#link-electron-licenses-file").attr("href", pathElectronLicensesFile);


                return;
            }

            private _onCommandVisitHelp() {
                var shell = require('electron').shell;
                shell.openExternal(HELP_SITE_URL);
                return;
            }

            /*
            * //tooltipを中央揃えにする。
            * @param $target : JQuery toolTipで説明されるDOMのJQuery要素
            */
            protected centeringTooltip($target: JQuery) {
                //tooltipを中央揃えにする。
                var $tooltip = $target.find(".tooltip-text");
                if ($tooltip != undefined) {
                    var widthButton = $target.width();
                    var widthToolTip = $tooltip.outerWidth(true);
                    var centeredLeft = (widthButton - widthToolTip) / 2;
                    $tooltip.css("left", centeredLeft + "px");
                    this.deterOverWindow($tooltip);
                }
            }

            /*
            * 画面からはみだる場合、端にそろえる
            * @param $target:JQuery これから表示するJQuery要素
            */
            protected deterOverWindow($target: JQuery) {
                let FUNCTION_NAME = "BasePage.ts : deterOverWindow : ";
                if ($target == undefined) {
                    console.error(FUNCTION_NAME + " $target is undefined");
                    return;
                }

                if ($target.offset() == undefined) {
                    return;
                }

                var left = $target.offset().left;
                var width = $target.outerWidth(true);

                if (left + width > innerWidth) {//windowからはみ出るとき
                    var tmpObj = {
                        top: $target.offset().top,
                        left: innerWidth - width,
                    }
                    $target.offset(tmpObj);
                }

            }

            /*
             * プルダウンメニュー対応
             */

            private _onOptionPullDownMenuClick() {
                var $overflow = this.$page.find("#option-pulldown-menu-popup"); // ポップアップのjQuery DOMを取得
                var $button1 = this.$page.find("#option-pulldown-menu");
                var $header = this.$page.find("header");

                var options: PopupOptions = {
                    x: $button1.offset().left,
                    y: 0,
                    tolerance: $header.height() + ",0",
                    corners: false
                };

                console.log("options.x options.y : " + options.x + ", " + options.y);

                $overflow.popup(options).popup("open").on("vclick", () => {
                    $overflow.popup("close");
                });

                $overflow.i18n();


                return;
            }


            /*
             * Garageのデザインで、Toastを標示する。
             */
            protected showGarageToast(message: string) {
                var FUNCTION_NAME ="BasePage.ts : showGarageToast : ";
                if (_.isUndefined(message)) {
                    console.log(FUNCTION_NAME + "message is undefined");
                }

                var style : UI.Toast.StyleBuilderDefault = new StyleBuilderDefault();
                UI.Toast.show(message, 1500, style);
            }

            /*
            * 禁則文字が入力された場合、含まれた禁則文字の文字列を返す。
            */
            protected getInhibitionWords(inputKey: string):string[] {
                let FUNCTION_NAME = "BasePage.ts : isInhibitionWord : "

                let result: string[] = [];
                let BLACK_LIST_INPUT_KEY: string[] =
                    [    '/' ,
                        ":" ,
                        ";" ,
                        "*" ,
                        "?" ,
                        "<" ,
                        ">",
                        '"',
                        "|",
                        '\\' ];

                for (let i = 0; i < BLACK_LIST_INPUT_KEY.length; i++){
                    if (inputKey.indexOf(BLACK_LIST_INPUT_KEY[i]) != -1) {
                         result.push(BLACK_LIST_INPUT_KEY[i]);
                    }
                }

                if (result.length === 0) {
                    return null;
                }

                return result;

            }


            /*
            * 禁則文字が入力された場合、トーストを出力し、禁則文字をぬいた文字列を返す。。
            */
            protected getRemovedInhibitionWords(inputValue: string): string{
                //入力した文字に禁則文字が含まれていた場合、トーストで表示。文字内容も削除。
                let inhibitWords: string[] = this.getInhibitionWords(inputValue);
                let resultString: string = inputValue;
                if (inhibitWords != null) {
                    let outputString: string = "";
                    for (let i = 0; i < inhibitWords.length; i++) {
                        if (i > 0) {
                            outputString += ", "
                        }
                        outputString += inhibitWords[i] + " ";

                        //GegExp(正規表現)を利用するために、頭に\\をつける。
                        inhibitWords[i] = "\\" + inhibitWords[i];
                         
                        var regExp = new RegExp(inhibitWords[i], "g");
                        resultString = resultString.replace(regExp, "");
                    }
                    outputString += $.i18n.t("toast.STR_TOAST_INPUT_INHIBITION_WORD");
                    this.showGarageToast(outputString);
                }
                
                return resultString;
            }


            /*
            * 横にセンタリング処理をする.
            * @param $target : JQuery   センタリングされるJquery要素
            * @param $base : JQuery 何のセンタリングなのかのJquery要素
            * @param targetScale :number $targetがCSS Transformでスケールされている場合,スケール値を入力( ex 0.5
            * @param baseScale :number $baseがCSS Transformでスケールされている場合,スケール値を入力( ex 0.5
            */
            protected layoutTargetOnCenterOfBase($target: JQuery, $base: JQuery, targetScale? :number, baseScale? : number) {
                let FUNCTION_NAME = TAG_BASE + " :layoutTargetOnCenterOfBase: ";

                if ($target == undefined) {
                    console.warn(FUNCTION_NAME + "$target is undefined");
                    return;
                }

                if ($base == undefined) {
                    console.warn(FUNCTION_NAME + "$base is undefined");
                    return;
                }

                let targetTop = $target.offset().top;
                let targetWidth = $target.outerWidth(true);
                if (targetScale) {
                    targetWidth = targetWidth * targetScale;
                }

                let baseLeft = $base.offset().left;
                let baseWidth = $base.outerWidth(true);
                if (baseScale) {
                    baseWidth = baseWidth * baseScale;
                }

                let targetLeft = baseLeft + baseWidth / 2 - targetWidth / 2;
                $target.offset({ top: targetTop, left: targetLeft });

            }


            /*
            * targetをbaseの真下にレイアウトするをする.
            * @param $target : JQuery   レイアウトされるJquery要素
            * @param $base : JQuery 何に対してレイアウトされるかを示す Jquery要素
            * @param targetScale :number $targetがCSS Transformでスケールされている場合,スケール値を入力( ex 0.5
            * @param baseScale :number $baseがCSS Transformでスケールされている場合,スケール値を入力( ex 0.5
            */
            protected layoutTargetOnButtomOfBase($target: JQuery, $base: JQuery, targetScale?: number, baseScale?: number) {
                let FUNCTION_NAME = TAG_BASE + " :layoutTargetOnButtomOfBase: ";

                if ($target == undefined) {
                    console.warn(FUNCTION_NAME + "$target is undefined");
                    return;
                }

                if ($base == undefined) {
                    console.warn(FUNCTION_NAME + "$base is undefined");
                    return;
                }

                let targetLeft = $target.offset().left;
                
                let baseTop = $base.offset().top;
                let baseHeight = $base.outerHeight(true);
                if (baseScale) {
                    baseHeight = baseHeight * baseScale;
                }

                let targetTop = baseTop + baseHeight;
                $target.offset({ top: targetTop, left: targetLeft });

            }


            /*
            * popupをすべて閉じる
            */
            protected closeAllPopups() {
                let FUNCTION_NAME = TAG_BASE + " :closeAllPopups: ";

                let $popups = $("section[data-role='popup']");
                //$popups.popup("close");
                
                if ($popups) {
                    $popups.each((index: number, elem: Element) => {
                        $(elem).popup("close");
                    });
                }

                let $uiPopups = $("select[data-native-menu='false']");
                if ($uiPopups) {
                    $uiPopups.each((index: number, elem: Element) => {
                        $(elem).selectmenu("close");
                    });
                }
            }


            /*
            * 
            */
            protected isMousePositionOn($target : JQuery, mousePosition : IPosition):boolean {
                let FUNCTION_NAME = TAG_BASE + " : isMousePositionOn : ";

                if ($target == undefined) {
                    console.warn(FUNCTION_NAME + "$target is undefined");
                    return;
                }

                if (mousePosition == undefined) {
                    console.warn(FUNCTION_NAME + "mousePosition is undefined");
                    return;
                }

                let targetX = $target.offset().left;
                let targetY = $target.offset().top;
                let targetW = $target.outerWidth(true);
                let targetH = $target.outerHeight(true);

                let mouseX = mousePosition.x;
                let mouseY = mousePosition.y;

                if (mouseX >= targetX && mouseX <= targetX + targetW) {
                    if (mouseY >= targetY && mouseY <= targetY+targetH){
                        return true;
                    }
                }

                return false;

            }

            /*
            * ふたつのエリアが重なっているか判定する
            * @param area1{IArea}
            * @param area2{IArea}
            * @return boolean
            */
            protected isOverlap(area1: IArea, area2: IArea): boolean {
                let FUNCTION_NAME = TAG_BASE + "isOverlap: ";

                if (area1 == null) {
                    console.warn(FUNCTION_NAME + "area1 is null");
                    return false;
                }

                if (area2 == null) {
                    console.warn(FUNCTION_NAME + "area2 is null");
                    return false;
                }

                if (area1.x < area2.x + area2.w && area2.x < area1.x + area1.w) {
                    if (area1.y < area2.y + area2.h && area2.y < area1.y + area1.h) {
                        return true;
                    }
                }

                return false;
            }


            /*
             * ターゲットのCSSの背景にURLを設定する。
             * @param $target{JQuery} 背景を設定する対象の JQuery
             * @param url{String} backgroundに設定する画像のurl
             */
            protected setBackgroundImageUrlInCSS($target: JQuery, imageUrl: string) {
                let FUNCTION_NAME = TAG_BASE + "setBackgroundImageUrlInCSS : ";

                if ($target == null) {
                    console.warn(FUNCTION_NAME + "$target is null");
                    return;
                }

                if (imageUrl == null) {
                    console.warn(FUNCTION_NAME + "imageUrl is null");
                    return;
                }

                //mac対策のため、シングルクォーテーションで囲む
                //ブラウザキャッシュ対策のため、現在時刻をクエリに設定
                $target.css("background-image", "url('" + imageUrl + "?" + (new Date()).getTime() + "')");

            }


            /*
             * ImageItemから、CSSを描画に必要なパスを取得する。
             * @param model{Model.ImageItem} CSSに表示したい画像モデル
             */
            protected getValidPathOfImageItemForCSS(model:ItemModel) :string {
                let FUNCTION_NAME = TAG_BASE + "getValidPathOfImageItemForCSS : ";

                if (model == null) {
                    console.warn(FUNCTION_NAME + "model is null");
                    return;
                }

                return this.getValidPathForCSS(model);
            }


            /*
             * ImageItemから、CSSを描画に必要なパスを取得する。
             * @param model{Model.ImageItem} CSSに表示したい画像モデル
             */
            protected getValidPathOfIGImageForCSS(model: IGImage): string {
                let FUNCTION_NAME = TAG_BASE + "getValidPathOfIGImageForCSS : ";

                if (model == null) {
                    console.warn(FUNCTION_NAME + "model is null");
                    return;
                }

                return this.getValidPathForCSS(model);
            }



            private getValidPathForCSS(model) {
                let FUNCTION_NAME = TAG_BASE + "getValidPathForCSS : ";

                if (model == null) {
                    console.warn(FUNCTION_NAME + "model is null");
                    return;
                }


                let inputPath = null;
                //有効なパスを優先順位順にサーチ
                let props: string[] = [
                    "resizeResolvedOriginalPathCSS",
                    "resolvedPathCSS",
                    "resizeResolvedOriginalPath",
                    "resolvedPath"
                ];
                for (let i = 0; i < props.length; i++) {
                    inputPath = model[props[i]];


                    try {
                        if (inputPath != null) {
                            console.log("valid path: " + props[i] + " = " + inputPath);
                            break;
                        }
                    } catch (e) {
                        console.warn(e);
                    }
                    // 有効なパスが無かった場合はnullを設定
                    inputPath = null;
                }

                if (inputPath != null) {
                    return inputPath;
                } else {
                    console.error(FUNCTION_NAME + "model " + model.cid + "not have valid path");
                    return;
                }

            }

            /*
             * リモコンをエクスポートする
             * @param remoteId{string} エクスポートするリモコンのID
             * @param faceName{string}:リモコン名
             * @param gmodules{IGModules[]} :書き出すリモコンにあるModule
             */
            protected exportRemote(face:Model.Face, masterFace:Model.Face = null) {
                let exportManager: Util.ExportManager = new Util.ExportManager(face, masterFace);
                exportManager.exec();
            }


            protected importRemote(callback?: Function) {
                let FUNCTION_NAME = TAG_BASE + "importRemote : ";

                //リモコン数上限チェック
                let canCreateResult = huisFiles.canCreateNewRemote();
                if (canCreateResult == -1) {
                    this.showErrorDialogRemoteNumLimit()
                } else {

                    //インポート処理
                    let importManager = new Util.ImportManager();
                    importManager.exec(() => {
                        if (callback) {
                            callback();
                        }
                    });
                    
                }

            }

            /*
             * リモコン数が上限だというエラーダイアログを表示する。
             */
            protected showErrorDialogRemoteNumLimit() {
                electronDialog.showMessageBox({
                    type: "error",
                    message: $.i18n.t("dialog.message.STR_DIALOG_MESSAGE_ALERT_LIMIT_1") + MAX_HUIS_FILES + $.i18n.t("dialog.message.STR_DIALOG_MESSAGE_ALERT_LIMIT_2"),
                    buttons: [$.i18n.t("dialog.button.STR_DIALOG_BUTTON_OK")],
                    title: PRODUCT_NAME,
                });

            }
           

        }
    }
}