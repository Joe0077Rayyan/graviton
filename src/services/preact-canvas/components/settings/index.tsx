/**
 * Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Component, h } from "preact";
import { bind } from "src/utils/bind.js";
import About from "../about";
import { Close } from "../icons/initial";
import {
  button as btnStyle,
  buttonOff as btnOffStyle,
  buttonOn as btnOnStyle,
  closeButton as closebtnStyle,
  closed as closedStyle,
  settings as settingsStyle,
  settingsWindow as settingsWindowStyle
} from "./style.css";

interface Props {
  onCloseClicked: () => void;
  onMotionPrefChange: () => void;
  open: boolean;
  motion: boolean;
}

interface State {
  aboutVisible: boolean;
}

export default class Settings extends Component<Props, State> {
  state: State = {
    aboutVisible: false
  };

  private focusItem?: HTMLElement;

  render(
    { onCloseClicked, onMotionPrefChange, open, motion }: Props,
    { aboutVisible }: State
  ) {
    return (
      <div
        role="dialog"
        aria-label="settings dialog"
        class={[settingsStyle, `${open ? "" : closedStyle}`].join(" ")}
      >
        <button
          aria-label={`close button`}
          class={closebtnStyle}
          ref={focusItem => (this.focusItem = focusItem)}
          onClick={aboutVisible ? this._onAboutCloseClicked : onCloseClicked}
        >
          <Close />
        </button>
        {aboutVisible ? (
          <div class={settingsWindowStyle}>
            <About />
          </div>
        ) : (
          <div class={settingsWindowStyle}>
            <button
              class={motion ? btnOnStyle : btnOffStyle}
              onClick={onMotionPrefChange}
            >
              Animations {motion ? "on" : "off"}
            </button>
            <button class={btnStyle} onClick={this._onAboutClicked}>
              About
            </button>
          </div>
        )}
      </div>
    );
  }

  componentDidUpdate() {
    if (this.props.open) {
      this.focusItem!.focus();
      return;
    }
  }

  @bind
  private _onAboutClicked() {
    this.setState({ aboutVisible: true });
  }

  @bind
  private _onAboutCloseClicked() {
    this.setState({ aboutVisible: false });
  }
}
