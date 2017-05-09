﻿ /// <reference path="../include/interfaces.d.ts" />

module Garage {
    export module View {
        import Tools = CDP.Tools;
        import Framework = CDP.Framework;
        import JQUtils = Util.JQueryUtils;

        var TAG = "[Garage.View.PropertyAreaButtonJump] ";

        export class PropertyAreaButtonJump extends PropertyAreaButtonBase {

            /** 
             * ページジャンプ設定として使用する信号番号
             */
            static DEFAULT_SIGNAL_ORDER: number = 0;

            /**
             * constructor
             * @param remoteId {string} 編集中のリモコンの remote_id
             * @param faceName {string} 編集中のリモコン名
             * @param gmodules {Model.Module[]} 編集中のリモコンのモジュール
             */
            constructor(remoteId: string, faceName: string, gmodules: Model.Module[], options?: Backbone.ViewOptions<Model.ButtonItem>) {
                super(options);

                this.remoteId = remoteId;
                this.faceName = faceName;
                this.gmodules = gmodules;

                this.availableRemotelist = huisFiles.getSupportedRemoteInfoInJump(remoteId, faceName, gmodules);
            }


            events() {
                return {
                    "change .action-input": "onActionPullDownListChanged",
                    "change .remote-input": "onRemotePullDownListChanged",
                    "change .page-input": "onPagePullDownListChanged",
                    "click #button-change-jump-dest": "onChangeJumpDestButtonClicked"
                };
            }


            //Actionを変更させたときに呼ばれる
            private onActionPullDownListChanged(event: Event) {
                let FUNCTION_NAME = TAG + "onActionPullDownListChanged";
                this.updateModel();
            }

            /**
             * リモコン選択用のプルダウンが変更されたときに呼ばれる
             */
            private onRemotePullDownListChanged(event: Event) {
                let FUNCTION_NAME = TAG + "onRemotePullDownListChanged";
                let $target = $(event.currentTarget);
                let remoteId = $target.val();

                //remoteIdがない場合、処理を終了する。
                if (remoteId == "none" || remoteId == null) {
                    return;
                }

                let order = this.getOrderFrom($target);
                if (!this.isValidOrder(order)) {
                    console.warn(FUNCTION_NAME + "order is invalid");
                    return;
                }

                this.renderRemoteIdOf(order, this.DEFAULT_STATE_ID, this.getRemoteIdFromPullDownOf(order));
                this.renderPagesOf(order, this.DEFAULT_STATE_ID);

                this.updateModel();

                this.triggerCreateRemoteSelect(order);
                this.refreshPageSelect(order);
            }


            /**
             * ページプルダウン変更時処理
             *
             * event {Event} changeイベント
             */
            private onPagePullDownListChanged(event: Event) {
                let FUNCTION_NAME = TAG + "onPagePullDownListChanged";
                let order = this.getOrderFrom($(event.currentTarget));
                if (!this.isValidOrder(order)) {
                    console.warn(FUNCTION_NAME + "order is invalid");
                    return;
                }

                this.renderPagesOf(order, this.DEFAULT_STATE_ID, this.getPageFromPullDownOf(order));
                this.refreshPageSelect(order);
                this.updateModel();
            }

            /**
             * ページジャンプ設定変更ボタン押下時イベント
             *
             * @param event {Event}
             */
            private onChangeJumpDestButtonClicked(event: Event) {
                this.showSelectRemotePageDialog();
            }




            /**
             * 保持しているモデルの内容で詳細エリアを描画する
             */
            renderView(): JQuery {
                let FUNCTION_NAME = TAG + ":renderView : ";

                let templateState = Tools.Template.getJST("#template-property-jump-button-state", this.templateItemDetailFile_);
                let $jumpContainer = this.$el.nextAll("#states-container");
                let stateData = this.createStateData(this.defaultState);
                stateData.actionList = ACTION_INPUTS_JUMP;
                stateData.jump = this.defaultState.action[0].jump;
                let $stateDetail = $(templateState(stateData));

                //テキストラベルの大きさの設定値を反映する。
                var $textSize = $stateDetail.find(".property-state-text-size[data-state-id=\"" + stateData.id + "\"]");
                if (!_.isUndefined(stateData.label)) {
                    var textSizeString: string = stateData.label.size;
                    $textSize.val(textSizeString);
                }

                $jumpContainer.append($stateDetail);

                this.setActionPullDown(this.defaultState);

                let targetRemoteId = stateData.jump.remote_id;
                if (huisFiles.getFace(targetRemoteId) != null || targetRemoteId == this.remoteId) {
                    this.renderRemoteIdOf(PropertyAreaButtonJump.DEFAULT_SIGNAL_ORDER, this.DEFAULT_STATE_ID, stateData.jump.remote_id);
                } else {
                    this.renderRemoteIdOf(PropertyAreaButtonJump.DEFAULT_SIGNAL_ORDER, this.DEFAULT_STATE_ID);
                }

                this.renderPagesOf(PropertyAreaButtonJump.DEFAULT_SIGNAL_ORDER, this.DEFAULT_STATE_ID, stateData.jump.scene_no);

                $jumpContainer.i18n();

                return $jumpContainer;
            }


            

            /////////////////////////////////////////////////////////////////////////////////////////
            ///// private method
            /////////////////////////////////////////////////////////////////////////////////////////

            /**
             * 保持しているモデルを表示内容に合わせてアップデートする。
             */
            private updateModel() {
                let FUNCTION_NAME = TAG + "updateModel : ";

                let tmpInput = this.$el.find(".action-input[data-state-id=\"" + this.model.default + "\"]").val();
                let newAction = $.extend(true, {}, this.defaultState.action[0]);
                newAction.input = tmpInput;
                newAction.jump = this.getJumpSettings();
                let newActions: IAction[] = [ newAction ];
                this.defaultState.action = newActions;

                let states: IGState[] = [];
                states.push(this.defaultState);

                this.model.state = states;
                this.trigger("updateModel");
            }

            /**
             * ActionのPullDownを変更する
             *
             * @param state {IGState}
             */
            private setActionPullDown(state: IGState) {
                let FUNCTION_NAME = TAG + "changeActionPullDown : ";

                let actions: IAction[] = state.action;
                if (actions == null || actions.length == 0) {
                    console.warn(FUNCTION_NAME + "acctions is null");
                    return;
                }

                //ActionのPullDownを変更する。
                //inputを読み取るアクションのIDは0とする。
                //マクロは複数の異なるアクションを設定できないためどのアクションを選択しても変わらない。
                let TARGET_ACTION = 0;
                var $actionPullDown: JQuery = this.$el.find(".action-input[data-state-id=\"" + state.id + "\"]");
                if ($actionPullDown && actions[TARGET_ACTION] && actions[TARGET_ACTION].input) {
                    $actionPullDown.val(actions[TARGET_ACTION].input);
                }
            }


            /**
             * ページジャンプ先を選択するためのリモコンページ選択ダイアログを表示する
             */
            private showSelectRemotePageDialog() {
                let dialog = new Util.SelectRemotePageDialog(
                    $.i18n.t("dialog.title.STR_DIALOG_TITLE_SELECT_JUMP"),
                    this.getJumpSettings(),
                    huisFiles.createTmpFace(this.remoteId, this.faceName, this.gmodules));

                dialog.show((result) => {
                    this.updateJumpSettings(result);
                });
            }


            /**
             * ページジャンプ設定とその表示を更新する
             * 新規ページジャンプ設定を渡さなかった場合は表示のみ更新する
             *
             * @param newSettings {IJump} ページジャンプ設定
             */
            private updateJumpSettings(newSettings: IJump) {
                this.setRemoteIdPullDownOf(0, newSettings.remote_id);
                
                this.renderPagesOf(0, undefined, newSettings.scene_no);

                let $targetSignalContainer = this.getSignalContainerElementOf(PropertyAreaButtonJump.DEFAULT_SIGNAL_ORDER);
                $targetSignalContainer.i18n();
                this.refreshRemoteSelect(PropertyAreaButtonJump.DEFAULT_SIGNAL_ORDER);
                this.refreshPageSelect(PropertyAreaButtonJump.DEFAULT_SIGNAL_ORDER);

                this.updateModel();
            }


            /**
             * 現在のページジャンプ設定を取得する
             *
             * @return {IJump} 現在のページジャンプ設定
             */
            private getJumpSettings(): IJump {
                let remoteId = this.getRemoteIdFromPullDownOf(PropertyAreaButtonJump.DEFAULT_SIGNAL_ORDER);
                let sceneNoText = this.getPageFromPullDownOf(PropertyAreaButtonJump.DEFAULT_SIGNAL_ORDER);
                let sceneNo: number = sceneNoText ? Number(sceneNoText) : 0;

                return {
                    remote_id: remoteId,
                    scene_no: sceneNo
                };
            }


            /*
            * 何も設定されていない場合、プルダウンをアクセント表示
            */
            focusFirstPulldown() {
                let FUNCTION_NAME = TAG + "focusFirstPulldown";

                //Actionが1つしかない、かつ remoteIdもfunctionも初期値の場合、
                //remoteId設定用プルダウンをフォーカスする。
                let ActionNum = this.model.state[this.DEFAULT_STATE_ID].action.length;

                let remoteId = this.getRemoteIdFromPullDownOf(PropertyAreaButtonJump.DEFAULT_SIGNAL_ORDER);

                if (!this.isValidValue(remoteId)) {
                    let input = this.$el.find("#select-remote-input-" + PropertyAreaButtonJump.DEFAULT_SIGNAL_ORDER);
                    setTimeout(() => {
                        input.focus();
                    });
                }
            }

        }
    }
}