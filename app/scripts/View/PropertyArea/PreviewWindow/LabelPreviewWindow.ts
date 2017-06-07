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

/// <reference path="../../../include/interfaces.d.ts" />

/* tslint:disable:max-line-length no-string-literal */

module Garage {
    export module View {

        var TAG = "[Garage.View.PropertyArea.PreviewWindow.LabelPreviewWindow] ";

        namespace constValue {
            export const TEMPLATE_DOM_ID = "#template-label-preview-window";
            export const DOM_ID = "#label-preview-window";
        }

        export class LabelPreviewWindow extends PreviewWindow {

            private textPreview_: TextPreview;


            constructor(label: Model.LabelItem) {
                super(label, constValue.DOM_ID, constValue.TEMPLATE_DOM_ID);
                this.textPreview_ = new TextPreview(label);
                this.listenTo(this.textPreview_, "uiChange:size", this._onTextSizePulldownChanged);
                this.listenTo(this.textPreview_, "uiChange:text", this._onTextFieldChanged);
            }


            events() {
                // Please add events
                return {

                };
            }


            private _onTextSizePulldownChanged(event: Event) {
                this.trigger("uiChange:size");//uiChange:textを親クラスであるPropertyAreaクラスに伝播させる
            }


            private _onTextFieldChanged(event: Event) {
                this.trigger("uiChange:text");//uiChange:textを親クラスであるPropertyAreaクラスに伝播させる
            }


            render(): Backbone.View<Model.Item> {
                let FUNCTION_NAME = TAG + "render : ";
                this.undelegateEvents(); //DOM更新前に、イベントをアンバインドしておく。
                this.$el.children().remove();
                this.$el.append(this.template_());
                this.$el.find(this.textPreview_.getDomId()).append(this.textPreview_.render().$el);
                this.delegateEvents();//DOM更新後に、再度イベントバインドをする。これをしないと2回目以降 イベントが発火しない。
                return this;
            };


            /*
             * @return {number} テキストサイズ用のプルダウンの値を取得
             */
            getTextSize(): number {
                return this.textPreview_.getTextSize();
            }


            /*
             * @return {string} テキストフィールドの値を取得
             */
            getText(): string {
                return this.textPreview_.getText();
            }
        }
    }
}
