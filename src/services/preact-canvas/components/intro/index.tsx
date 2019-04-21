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
import { bind } from "../../../../utils/bind.js";

import { Arrow } from "../icons/initial.js";
import TopBar from "../top-bar/index.js";
import {
  field as fieldStyle,
  intro as introStyle,
  label as labelStyle,
  labelText as labelTextStyle,
  numberDownArrow as numberDownArrowStyle,
  numberUpArrow as numberUpArrowStyle,
  selectArrow as selectArrowStyle,
  settingsRow as settingsRowStyle,
  startButton as startButtonStyle,
  startButtonTextHide,
  startButtonTextShow,
  startForm as startFormStyle
} from "./style.css";

interface NumberFieldProps extends JSX.HTMLAttributes {
  inputRef: JSX.HTMLAttributes["ref"];
}

class NumberField extends Component<NumberFieldProps, {}> {
  private _input?: HTMLInputElement;

  render(props: NumberFieldProps) {
    const { children, inputRef, ...inputProps } = props;

    return (
      <label class={labelStyle}>
        <Arrow class={numberUpArrowStyle} onClick={this._onUpClick} />
        <Arrow class={numberDownArrowStyle} onClick={this._onDownClick} />
        <span class={labelTextStyle}>{props.children}</span>
        <input
          ref={el => {
            this._input = el;
            if (inputRef) {
              inputRef(el);
            }
          }}
          class={fieldStyle}
          type="number"
          {...inputProps}
        />
      </label>
    );
  }

  @bind
  private _onUpClick() {
    this._input!.valueAsNumber = Math.min(
      this._input!.valueAsNumber + 1,
      Number(this._input!.max)
    );
    this._dispatch();
  }

  @bind
  private _onDownClick() {
    this._input!.valueAsNumber = Math.max(
      this._input!.valueAsNumber - 1,
      Number(this._input!.min)
    );
    this._dispatch();
  }

  private _dispatch() {
    this._input!.dispatchEvent(new Event("change"));
  }
}

const presets = {
  advanced: { width: 16, height: 16, mines: 40 },
  beginner: { width: 8, height: 8, mines: 10 },
  expert: { width: 24, height: 24, mines: 99 }
};

type PresetName = keyof typeof presets;

export interface Props {
  onStartGame: (width: number, height: number, mines: number) => void;
  loading: boolean;
  inert: boolean;
}

interface State {
  presetName: PresetName | "custom";
  width: number;
  height: number;
  mines: number;
  longLoad: boolean;
}

// tslint:disable-next-line:max-classes-per-file
export default class Intro extends Component<Props, State> {
  state: State = {
    presetName: "beginner",
    longLoad: false,
    ...presets.beginner
  };

  private _presetSelect?: HTMLSelectElement;
  private _widthInput?: HTMLInputElement;
  private _heightInput?: HTMLInputElement;
  private _minesInput?: HTMLInputElement;

  componentDidMount() {
    window.scrollTo(0, 0);

    setTimeout(() => {
      this.setState({ longLoad: true });
    }, 1000);
  }

  render(
    { loading, inert }: Props,
    { width, height, mines, presetName, longLoad }: State
  ) {
    return (
      <div class={introStyle} inert={inert}>
        <TopBar titleOnly />
        <form onSubmit={this._startGame} class={startFormStyle}>
          <div class={settingsRowStyle}>
            <label class={labelStyle}>
              <span class={labelTextStyle}>Preset</span>
              <Arrow class={selectArrowStyle} />
              <select
                class={fieldStyle}
                ref={el => (this._presetSelect = el)}
                onChange={this._onSelectChange}
                value={presetName}
              >
                <option value="beginner">Beginner</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
                <option value="custom">Custom</option>
              </select>
            </label>
          </div>
          <div class={settingsRowStyle}>
            <NumberField
              min="5"
              max="40"
              step="1"
              value={width}
              inputRef={el => (this._widthInput = el)}
              onChange={this._onSettingInput}
            >
              Width
            </NumberField>
            <NumberField
              min="5"
              max="40"
              step="1"
              value={height}
              inputRef={el => (this._heightInput = el)}
              onChange={this._onSettingInput}
            >
              Height
            </NumberField>
          </div>
          <div class={settingsRowStyle}>
            <NumberField
              min="1"
              max={width * height}
              step="1"
              value={mines}
              inputRef={el => (this._minesInput = el)}
              onChange={this._onSettingInput}
            >
              Black holes
            </NumberField>
          </div>
          <div class={settingsRowStyle}>
            <button class={startButtonStyle} disabled={loading}>
              <span
                class={
                  longLoad || !loading
                    ? startButtonTextShow
                    : startButtonTextHide
                }
              >
                {loading
                  ? longLoad
                    ? "…Loading…"
                    : "\u00A0" // non-breaking space, to retain height
                  : "Start"}
              </span>
            </button>
          </div>
        </form>
      </div>
    );
  }

  @bind
  private _onSelectChange() {
    const presetName = this._presetSelect!.value as PresetName | "custom";

    if (presetName === "custom") {
      this.setState({ presetName });
      return;
    }

    const preset = presets[presetName];

    this.setState({
      height: preset.height,
      mines: preset.mines,
      presetName,
      width: preset.width
    });
  }

  @bind
  private _onSettingInput() {
    const width = this._widthInput!.valueAsNumber;
    const height = this._heightInput!.valueAsNumber;
    const mines = this._minesInput!.valueAsNumber;

    for (const [presetName, preset] of Object.entries(presets)) {
      if (
        width === preset.width &&
        height === preset.height &&
        mines === preset.mines
      ) {
        this.setState({
          height: preset.height,
          mines: preset.mines,
          presetName: presetName as PresetName,
          width: preset.width
        });
        return;
      }
    }

    this.setState({
      height,
      mines: mines >= width * height ? width * height - 1 : mines,
      presetName: "custom",
      width
    });
  }

  @bind
  private _startGame(event: Event) {
    event.preventDefault();
    this.props.onStartGame(
      this.state.width,
      this.state.height,
      this.state.mines
    );
  }
}
