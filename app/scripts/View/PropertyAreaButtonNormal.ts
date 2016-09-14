﻿/// <reference path="../include/interfaces.d.ts" />

/* tslint:disable:max-line-length no-string-literal */

module Garage {
	export module View {
		import Tools = CDP.Tools;
        import Framework = CDP.Framework;
        import JQUtils = Util.JQueryUtils;

		var TAG = "[Garage.View.PropertyAreaNormal] ";

      
        export class PropertyAreaButtonNormal extends PropertyAreaButtonBase {

         
			/**
			 * constructor
			 */
            constructor(options?: Backbone.ViewOptions<Model.ButtonItem>) {
                super(options);
            }






            /////////////////////////////////////////////////////////////////////////////////////////
            ///// event method
            /////////////////////////////////////////////////////////////////////////////////////////

            events() {
                // Please add events
                return {
                    "click #add-signal-btn": "onPlusBtnClick",
                    "change .action-input": "onActionPullDownListChanged",
                    "change .remote-input": "onRemotePullDownListChanged",
                    "change .function-input": "onFunctionPulllDownListChanged",
                    "click .delete-signal": "onDeleteButtonClick",
                };
            }

            //deleteボタンが押されたときに呼ばれる
            private onDeleteButtonClick(event: Event) {
                let FUNCTION_NAME = TAG + "onDeleteButtonClick";
                let $target = $(event.currentTarget);
                let order = this.getOrderFrom($target);

                this.deleteSignal(order);

            }

            //+ボタンがクリックされた場合に呼び出される
            private onPlusBtnClick(event: Event) {
                let FUNCTION_NAME = TAG + "onPlusBtnClick : ";

                let $target = $(event.currentTarget);
                if ($target.hasClass("disabled")) {
                    return;
                }
              
                let order = this.model.state[this.DEFAULT_STATE_ID].action.length;
                let stateId = this.getStateIdFrom($target);
              
                //すでに、同じorderのDOMがない場合には追加
                let $newSignalContainerElement = this.getSignalContainerElementOf(order);
                if ($newSignalContainerElement.length == 0) {
                    this.renderSignalContainerMin(order, stateId);
                } else {
                    console.warn(FUNCTION_NAME + "order : " + order + "is already exist. ");
                }

                //動的に追加されたcustom-selecctないのselectに対して、JQueryを適応する
                $('.custom-select').trigger('create');

                this.controlPlusButtonEnableDisable();

            }

            //Actionを変更させたときに呼ばれる
            private onActionPullDownListChanged(event: Event) {
                let FUNCTION_NAME = TAG + "onActionPullDownListChanged";

                let $target = $(event.currentTarget);
                if (!this.isValidJQueryElement($target)) {
                    console.warn(FUNCTION_NAME + "$target is invalid");
                    return;
                }

                this.updateModel(this.DEFAULT_STATE_ID);

            }

            //リモコン選択用のプルダウンが変更されたときに呼ばれる
            private onRemotePullDownListChanged(event: Event) {
                let FUNCTION_NAME = TAG + "onRemotePullDownListChanged";
                let $target = $(event.currentTarget);
                let remoteId = $target.val();

                //remoteIdがない場合、処理を終了する。
                if (remoteId == "none" || remoteId == null) {
                    return;
                }

                // プルダウンに設定されている Actionの順番を取得
                let order = this.getOrderFrom($target);
                if (order == null) {
                    return;
                }

                //Function選択用のPullダウンにFunctionを設定する。
                this.renderFunctionsOf(order, this.DEFAULT_STATE_ID);
                this.updateModel(this.DEFAULT_STATE_ID);
            }

            //機能選択用のプルダウンが変更されたときに呼び出される
            private onFunctionPulllDownListChanged(event: Event) {
                let FUNCTION_NAME = TAG + "onFunctionPulllDownListChanged";
                this.updateModel(this.DEFAULT_STATE_ID);
            }




            /////////////////////////////////////////////////////////////////////////////////////////
            ///// public method
            /////////////////////////////////////////////////////////////////////////////////////////

            /*
            * 保持しているモデルうち、指定したRemoteIdの内容でプルダウンを描画する
            */
            renderViewState(stateId : number): JQuery {
                let FUNCTION_NAME = TAG + "renderViewState";

                if (stateId == null) {
                    console.warn(FUNCTION_NAME + "stateId is null");
                    return;
                }

                return this.renderSignals(stateId);
                
            }

            updateModel(stateId : number) {
                let FUNCTION_NAME = TAG + "updateModel : ";


                //orderをkeyとしたActionのハッシュを作成。
                let tmpActionsWithOrder = {};

                //現状表示されている 各信号のJquery値を取得
                let $signalContainers: JQuery = this.$el.find(".signal-container-element");

                // 信号のJqueryがない場合、return
                if (!this.isValidJQueryElement($signalContainers)) {
                    return;
                }

                //それぞのアクションのプルダウンの値を取得。
                for (let i = 0; i < $signalContainers.length; i++) {

                    //Actionの順番を取得。取得できない場合は次のループへ
                    let $target: JQuery = $($signalContainers[i]);
                    let order = this.getOrderFrom($target);
                    if (order == null) {
                        continue;
                    }

                    let tmpInput = this.getInputAction(order);
                    if (!this.isValidValue(tmpInput)) {
                        tmpInput = null;
                    }
                   
                    //remoteIdを仮取得
                    let tmpRemoteId: string = this.getRemoteIdFromPullDownOf(order);
                    if (!this.isValidValue(tmpRemoteId)) {
                        tmpRemoteId = null;
                    }

                    //functionを仮取得
                    let tmpFunction: string = this.getFunctionFromlPullDownOf(order);
                    if (!this.isValidValue(tmpFunction)) {
                        tmpFunction = null;
                    }

                    let deviceInfo = huisFiles.getDeviceInfo(tmpRemoteId);


                    let tmpAction: IAction = {
                        input: tmpInput,
                    };


                    if (deviceInfo) {
                        //deviceInfo.functionCodeHashがある場合、codeを取
                        //codeを入力
                        let tmpCode = null;

                        if (deviceInfo.functionCodeHash) {
                            tmpCode = deviceInfo.functionCodeHash[tmpFunction];
                        }
                        if (tmpCode != null) {
                            tmpAction.code = tmpCode;
                        }

                        //codeDbを入力
                        let tmpCodeDb: ICodeDB = null;
                        if (deviceInfo.code_db) {
                            tmpCodeDb = deviceInfo.code_db;
                            tmpCodeDb.function = tmpFunction;
                        }
                        if (tmpCodeDb != null) {
                            tmpAction.code_db = tmpCodeDb;
                        }

                        //bluetooth_dataを入力
                        let tmpBluetoothData = null
                        if (deviceInfo.bluetooth_data != null){
                            tmpBluetoothData = deviceInfo.bluetooth_data;
                        }
                        if (tmpBluetoothData != null) {
                            tmpAction.bluetooth_data = tmpBluetoothData;
                        }
                        
                    }

                    tmpActionsWithOrder[order] = tmpAction;

                }

                //order順に並び変えて配列にいれる。
                let actionsForUpdate: IAction[] = [];
                let keys = Object.keys(tmpActionsWithOrder);
                let keysNumCount: number = 0;;
                for (let i = 0; i < MAX_NUM_MACRO_SIGNAL; i++) {

                    //keyに i がある場合、push
                    if (keys.indexOf(i.toString()) != -1) {
                        actionsForUpdate.push(tmpActionsWithOrder[i]);
                        keysNumCount++;
                        //keyすべてに対して 判定をしていたらループを抜ける。
                        if (keysNumCount >= keys.length) {
                            break;
                        }
                    }
                }

                let tmpState  = this.model.state[stateId];
    
                let newState: IGState = {
                    id: tmpState.id,
                    image: tmpState.image && tmpState.image ? tmpState.image : undefined,
                    label: tmpState.label && tmpState.label ? tmpState.label : undefined,
                    action: actionsForUpdate && 0 < actionsForUpdate.length ? actionsForUpdate : undefined,
                    translate: tmpState.translate && 0 < tmpState.translate.length ? tmpState.translate : undefined
                };

                let states: IGState[] = [];
                //全stateを更新。
                for (let i = 0; i < this.model.state.length; i++){
                    if (i == stateId) {
                        states.push(newState);
                    } else {
                        states.push(this.model.state[i]);
                    }
                }



                this.model.state = states;

                //更新後の値で、+ボタンの有効・無効判定を行う。
                this.controlPlusButtonEnableDisable();

                this.trigger("updateModel");

                
            }



            /////////////////////////////////////////////////////////////////////////////////////////
            ///// private method
            /////////////////////////////////////////////////////////////////////////////////////////

            /*
            * 現在、表示されているStateIdを取得する
            */
            private getStateId(): number {
                let FUNCTION_NAME: string = TAG + "getStateId : ";

                //+ボタンをstateIdを取得できるソースととる
                let $sorce = this.$el.find("#add-signal-btn");

                if (!this.isValidJQueryElement($sorce)) {
                    console.warn(FUNCTION_NAME + "$source is invalid");
                }

                return parseInt(JQUtils.data($sorce, "stateId"), 10);
            }

            /*
            * 入力されたorderに設定されている信号を削除する
            * @param order{number}: それぞれの信号に設定されている順番
            */
            private deleteSignal(order: number) {
                let FUNCTION_NAME = TAG + "deleteSignal";

                if (order == null) {
                    console.warn(FUNCTION_NAME + "order is null");
                    return;
                }

                let $target = this.$el.find(".signal-container-element[data-signal-order=\"" + order + "\"]");
                $target.remove();

                let targetStateId = this.getStateId();

                //消えた後のプルダウンの値に合わせてアップデート
                this.updateModel(targetStateId);

                //アップデートされたモデルに合わせてプルダウン部をレンダリング
                this.renderSignals(targetStateId);

            }

            /*
            * 信号プルダウンメニューたちをレンダリングする
            * @param stateId{number} ターゲットとなるstateId
            * @param $signalsContainer{JQuery} ベースとなるJQuery要素
            */
            private renderSignals(stateId: number){
                let FUNCTION_NAME: string = TAG + "renderSignals : ";

                if (stateId == null) {
                    console.warn(FUNCTION_NAME + "stateId is null");
                    return;
                }

                let actions: IAction[] = this.model.state[stateId].action;

                if (actions == null || actions.length == 0) {
                    console.warn(FUNCTION_NAME + "actions is invalid");
                    return;
                }

                //一度、全部削除する
                this.$el.find("#signals-container").children().remove();

                for (let i = 0; i < actions.length; i++) {
                    let targetAction = actions[i];
                    if (targetAction == null) {
                        continue;
                    }

                    let actionInput: string = targetAction.input;
                    let remoteId = this.getRemoteIdByAction(targetAction);
                    let functionName = this.getFunctionNameFromAction(targetAction);

                    this.renderSignalContainerMin(i, stateId, actionInput, remoteId);

                    //function設定用pulldownをレンダリング
                    this.renderFunctionsOf(i, stateId, functionName);
                }

                this.controlPlusButtonEnableDisable();

                return this.$el;

            }

            /*
            * 信号のベースと必須のアクション選択プルダウン分をレンダリングする
            * @param order{number}
            * @param stateId{number}
            * @param $signalContainer{JQuery} 信号をレンダリングするベースとなりJQuery要素
            * @param inputAction{string}
            * @param remoteId?{string}
            */
            private renderSignalContainerMin(order: number, stateId: number, inputAction? : string, remoteId?:string) {
                let FUNCTION_NAME: string = TAG + "renderSignalContainer";

                if (order == null) {
                    console.warn(FUNCTION_NAME + "order is null");
                    return;
                }

                if (stateId == null) {
                    console.warn(FUNCTION_NAME + "stateId is null");
                    return;
                }


                let $signalsContainer: JQuery = this.$el.find("#signals-container");

                if (!this.isValidJQueryElement($signalsContainer)) {
                    console.warn(FUNCTION_NAME + "$signalsConteinr is invalid");
                    return;
                }

                this.renderSignalContainerBase(order);
                //actino設定用のpulldownをレンダリング
                this.renderActionPulllDownOf(order, stateId, inputAction);
                //remoteId設定用のpulldownをレンダリング
                this.renderRemoteIdOf(order, stateId, remoteId);
            }

            /*
            *  信号を描画するベースとなる部分をレンダリングする。
            *  @param order{number}
            *  @param $signalContainer{JQuery} 信号をレンダリングするベースとなりJQuery要素
            */
            private renderSignalContainerBase(order: number) {
                let FUNCTION_NAME = TAG + "renderSignalContainerBase : ";

                let $signalsContainer: JQuery = this.$el.find("#signals-container");
                if (!this.isValidJQueryElement($signalsContainer)) {
                    console.warn(FUNCTION_NAME + "$signalsConteinr is invalid");
                    return;
                }


                if (order == null) {
                    console.warn(FUNCTION_NAME + "order is null");
                    return;
                }

                if (!this.isValidJQueryElement($signalsContainer)) {
                    console.warn(FUNCTION_NAME + "$signalsConteinr is null");
                    return;
                }

                //SignalContainerのベースをレンダリング
                let templateSignal = Tools.Template.getJST("#template-property-button-signal-normal", this.templateItemDetailFile_);

                let inputData = {
                    order: order,
                };

                let $signalDetail = $(templateSignal(inputData));
                $signalsContainer.append($signalDetail);

            }

            /*
            * アクション設定用のpullldownMenuをレンダリングする
            * @param order{number} 上から何番目の信号か
            * @param stateid{number} 
            * @param inputAction? {string} プルダウンの初期値 
            */
            private renderActionPulllDownOf(order: number,stateId:number, inputAction? : string) {
                let FUNCTION_NAME: string = TAG + "renderActionPulllDownOf : ";

                if (order == null) {
                    console.warn(FUNCTION_NAME + "order is null");
                    return;
                }

                if (stateId == null) {
                    console.warn(FUNCTION_NAME + "staeId is null");
                    return;
                }

                //targetとなるJQueryを取得
                let $target: JQuery = this.$el.find(".signal-container-element[data-signal-order=\"" + order + "\"]");
                if ($target == null || $target.length == 0) {
                    console.warn("$target is undefined");
                    return;
                }

                //ActionプルダウンのDOMを表示。
                let $actionContainer = $target.find("#signal-action-container");
                let templateAction: Tools.JST = Tools.Template.getJST("#template-property-button-signal-action", this.templateItemDetailFile_);

                

                let inputData = {
                    id: stateId,
                    order: order,
                    remotesList: this.availableRemotelist,
                    actionList : ACTION_INPUTS
                }

                let $actionDetail = $(templateAction(inputData));
                $actionContainer.append($actionDetail);

                //inputActionを入力していた場合、値を表示
                if (inputAction != null) {
                    this.setInputAction(order, stateId, inputAction);
                }

                //Functionの文言を和訳
                $actionContainer.i18n();

                //プルダウンにJQueryMobileのスタイルをあてる
                $actionContainer.trigger('create');

            }
            
            /*
           * アクション設定用のpullldownMenuをgetする
           * @param order{number} 
           */
            private getInputAction(order: number) {
                let FUNCTION_NAME = TAG + "getInputAction : ";

                if (order == null) {
                    console.warn(FUNCTION_NAME + "order is null");
                    return;
                }

                let $signalContainerElement = this.getSignalContainerElementOf(order);
                if ($signalContainerElement == null) {
                    console.warn(FUNCTION_NAME + "$signalContainerElement is null");
                    return;
                }

                let $actionPullDown = $signalContainerElement.find(".action-input[data-signal-order=\"" + order + "\"]");
                if ($actionPullDown == null || $actionPullDown.length == 0) {
                    console.warn(FUNCTION_NAME + "$actionPullDown is invalid");
                    return;
                }

                let inputType : string = $actionPullDown.val();

                //"none"も見つからない扱いとする。
                if (!this.isValidValue(inputType)) {
                    return;
                }

                return inputType;
            }


            /*
             * inputするアクションをセットする
             * @param order{number} 
             * @param stateid{number}
             */
            private setInputAction(order: number, stateId: number, inputType: string) {
                let FUNCTION_NAME = TAG + "setInputAction : ";

                if (order == null) {
                    console.warn(FUNCTION_NAME + "order is null");
                    return;
                }

               
                let $signalContainerElement = this.getSignalContainerElementOf(order);
                if ($signalContainerElement == null) {
                    console.warn(FUNCTION_NAME + "$signalContainerElement is null");
                    return;
                }

                let $actionPullDown = $signalContainerElement.find(".action-input[data-signal-order=\"" + order + "\"]");
                if ($actionPullDown == null || $actionPullDown.length == 0) {
                    console.warn(FUNCTION_NAME + "$actionPullDown is invalid");
                    return;
                }

                //"none"も見つからない扱いとする。
                if (this.isValidValue(inputType)) {
                    $actionPullDown.val(inputType);
                }

                

            }


            /*
            * 表示されているすべての信号登録用pulldownに情報が埋まっているか否かを返す。
            */
            private isAllSignalPullDownSelected() {
                let FUNCTION_NAME = TAG + "isAllPullDownSelected";

                //現状表示されている 各信号のJquery値を取得
                let $signalContainers: JQuery = this.$el.find(".signal-container-element");

                // 信号のJqueryがない場合、すべてが埋まっていると扱う
                if ($signalContainers.length == 0) {
                    return true;
                }


                //それぞのアクションのプルダウンの値を取得。
                for (let i = 0; i < $signalContainers.length; i++) {
                    let $target: JQuery = $($signalContainers[i]);

                    //それぞれのプルダウンが存在し、利用不能な値が代入されている場合、false;

                    //action
                    let $actionPulllDown = $target.find("select.action-input");
                    if ($actionPulllDown.length != 0) {
                        let value = $actionPulllDown.val();
                        if (!this.isValidValue(value)) {
                            return false;
                        }
                    }

                    //remoteId
                    let $remoteIdlPulllDown = $target.find("select.remote-input");
                    if ($remoteIdlPulllDown.length != 0) {
                        let value = $remoteIdlPulllDown.val();
                        if (!this.isValidValue(value)) {
                            return false;
                        }
                    }

                    //function
                    let $functionlPulllDown = $target.find("select.function-input");
                    if ($functionlPulllDown.length != 0) {
                        let value = $functionlPulllDown.val();
                        if (!this.isValidValue(value)) {
                            return false;
                        }
                    }
                }

                //一回も無効な数値が判定されない ＝ すべて有効な値。としてtrue;
                return true;

            }


            // +ボタンのenable disableを判定・コントロールする。
            private controlPlusButtonEnableDisable() {
                let FUNCTINO_NAME = TAG + "controlPlusButtonEnableDisable";
                let $target = this.$el.find("#add-signal-btn");

                //すべてのpullDownがうまっているとき、+をenableに、それ以外はdisable
                if (this.isAllSignalPullDownSelected()) {
                    $target.removeClass("disabled");
                } else {
                    $target.addClass("disabled");
                }

                //設定できるマクロ最大数だった場合もdisable
                if (this.model.state[this.DEFAULT_STATE_ID].action.length >= Object.keys(ACTION_INPUTS).length) {
                    $target.removeClass("disabled");
                }

            }

           

        }
	}
}