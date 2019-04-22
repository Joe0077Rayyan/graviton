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

import { Remote } from "comlink/src/comlink.js";
import { Component, h, render, VNode } from "preact";
import { bind } from "src/utils/bind.js";
import { StateChange as GameStateChange } from "../../gamelogic";
import initInert from "../../utils/inert";
import { GameType } from "../state";
import StateService from "../state/index.js";
import localStateSubscribe from "../state/local-state-subscribe.js";
import {
  getMotionPreference,
  setMotionPreference
} from "../state/motion-preference";
import BottomBar from "./components/bottom-bar";
import deferred from "./components/deferred";
import Intro from "./components/intro/index.js";
import Settings from "./components/settings";
import { game as gameClassName, main } from "./style.css";

interface Props {
  stateServicePromise: Promise<Remote<StateService>>;
}

interface State {
  game?: GameType;
  stateService?: Remote<StateService>;
  dangerMode: boolean;
  texturesReady: boolean;
  settingsOpen: boolean;
  motionPreference: boolean;
}

// install inert polyfill for A11y
initInert();

export type GameChangeCallback = (stateChange: GameStateChange) => void;

// tslint:disable-next-line:variable-name
const Nebula = deferred(
  import("./components/nebula/index.js").then(m => m.default)
);

// tslint:disable-next-line:variable-name
const Game = deferred(
  import("./components/game/index.js").then(m => m.default)
);

const texturePromise = import("../../rendering/animation").then(m =>
  m.lazyGenerateTextures()
);

class PreactService extends Component<Props, State> {
  state: State = {
    dangerMode: false,
    texturesReady: false,
    settingsOpen: false,
    motionPreference: true
  };
  private previousFocus: HTMLElement | null = null;

  private _gameChangeSubscribers = new Set<GameChangeCallback>();

  constructor(props: Props) {
    super(props);
    this._init(props);
  }

  render(
    _props: Props,
    {
      game,
      stateService,
      dangerMode,
      texturesReady,
      settingsOpen,
      motionPreference
    }: State
  ) {
    let mainComponent: VNode;

    if (!game) {
      mainComponent = (
        <Intro
          onStartGame={this._onStartGame}
          loading={!stateService || !texturesReady}
          inert={settingsOpen ? true : false}
        />
      );
    } else {
      mainComponent = (
        <Game
          loading={() => <div />}
          key={game.id}
          width={game.width}
          height={game.height}
          mines={game.mines}
          toRevealTotal={game.toRevealTotal}
          gameChangeSubscribe={this._onGameChangeSubscribe}
          gameChangeUnsubscribe={this._onGameChangeUnsubscribe}
          stateService={stateService!}
          dangerMode={dangerMode}
          onDangerModeChange={this._onDangerModeChange}
          inert={settingsOpen ? true : false}
        />
      );
    }

    return (
      <div class={gameClassName}>
        <Nebula
          loading={() => <div />}
          dangerMode={game ? dangerMode : false}
        />
        {mainComponent}
        <BottomBar
          onFullscreenClick={this._onFullscreenClick}
          onSettingsClick={this._onSettingsClick}
          inert={settingsOpen ? true : false}
        />
        <Settings
          onCloseClicked={this._onSettingsCloseClicked}
          open={settingsOpen}
          motion={motionPreference}
          onMotionPrefChange={this._onMotionPrefChange}
        />
      </div>
    );
  }

  componentDidMount() {
    window.addEventListener("keyup", this._onKeyUp);
  }

  @bind
  private _onKeyUp(event: KeyboardEvent) {
    if (event.key === "Escape" && this.state.settingsOpen) {
      this._onSettingsClick();
    }
  }

  @bind
  private _onMotionPrefChange() {
    setMotionPreference(!this.state.motionPreference).then(newPreference => {
      this.setState({ motionPreference: newPreference });
    });
  }

  @bind
  private _onDangerModeChange(dangerMode: boolean) {
    this.setState({ dangerMode });
  }

  @bind
  private _onGameChangeSubscribe(func: GameChangeCallback) {
    this._gameChangeSubscribers.add(func);
  }

  @bind
  private _onGameChangeUnsubscribe(func: GameChangeCallback) {
    this._gameChangeSubscribers.delete(func);
  }

  @bind
  private _onFullscreenClick() {
    document.documentElement.requestFullscreen();
  }

  @bind
  private _onSettingsCloseClicked() {
    this._onSettingsClick();
  }

  @bind
  private _onSettingsClick() {
    if (!this.state.settingsOpen) {
      this.previousFocus = document.activeElement as HTMLElement;
    }
    this.setState({ settingsOpen: !this.state.settingsOpen });

    if (!this.state.settingsOpen) {
      setTimeout(() => {
        this.previousFocus!.focus();
      }, 0);
    }
  }

  @bind
  private _onStartGame(width: number, height: number, mines: number) {
    this.state.stateService!.initGame(width, height, mines);
  }

  private async _init(props: Props) {
    texturePromise.then(() => {
      this.setState({ texturesReady: true });
    });

    const stateService = await props.stateServicePromise;
    this.setState({ stateService });

    const motionPreference = await getMotionPreference();
    this.setState({ motionPreference });

    localStateSubscribe(stateService, stateChange => {
      if ("game" in stateChange) {
        this.setState({ game: stateChange.game });
      }
      if ("gameStateChange" in stateChange) {
        for (const callback of this._gameChangeSubscribers) {
          callback(stateChange.gameStateChange!);
        }
      }
    });
  }
}

export async function game(stateService: Promise<Remote<StateService>>) {
  const container = document.body.querySelector("main")!;
  container.classList.add(main);
  render(
    <PreactService stateServicePromise={stateService} />,
    container,
    container.firstChild as any
  );
  performance.mark("UI ready");
}
