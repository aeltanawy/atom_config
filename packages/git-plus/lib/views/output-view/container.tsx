import { Dock, WorkspaceCenter } from "atom";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { Root } from "./Root";

function isDock(container: Dock | WorkspaceCenter): container is Dock {
  return (container as any).getLocation() !== "center";
}

export class OutputViewContainer {
  static URI = "git-plus://output-view";

  private _isDestroyed = false;
  element: HTMLElement;

  constructor() {
    this.element = document.createElement("div");
    this.element.classList.add("git-plus", "output");
    this.render();
    atom.workspace.open(this, { activatePane: false });
  }

  getURI() {
    return OutputViewContainer.URI;
  }

  getTitle() {
    return "Git+";
  }

  getDefaultLocation() {
    return "bottom";
  }

  serialize() {
    return {
      deserializer: "git-plus/output-view"
    };
  }

  async show() {
    const focusedPane = atom.workspace.getActivePane();
    await atom.workspace.open(this, { activatePane: true });
    if (focusedPane && !focusedPane.isDestroyed()) focusedPane.activate();
  }

  hide() {
    atom.workspace.hide(this);
  }

  render() {
    ReactDOM.render(<Root container={this} />, this.element);
  }

  toggle() {
    atom.workspace.toggle(this);
  }

  destroy() {
    ReactDOM.unmountComponentAtNode(this.element);
    this.element.remove();
    this._isDestroyed = true;
  }

  get isDestroyed() {
    return this._isDestroyed;
  }

  static isVisible() {
    const container = atom.workspace.paneContainerForURI(OutputViewContainer.URI);
    if (container) {
      const activeItem = container.getActivePaneItem();
      const viewIsActive = activeItem instanceof OutputViewContainer;
      if (isDock(container)) {
        return container.isVisible() && viewIsActive;
      }
      return viewIsActive;
    }
    return false;
  }
}
