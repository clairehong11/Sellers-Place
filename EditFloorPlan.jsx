import React from "react";
import GridLayout from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import ContentWrapper from "../layout/ContentWrapper";
import EditSpaceModal from "./EditSpaceModal";
import CopyFloorPlanModal from "./CopyFloorPlanModal";
import PropTypes from "prop-types";
import logger from "../../logger";
import * as floorPlanService from "../../services/floorPlanService";
import * as spacesService from "../../services/spacesService";
import { toast } from "react-toastify";
import "./FloorPlan.css";

const _logger = logger.extend("EditFloorPlan");

class EditFloorPlan extends React.PureComponent {
  state = {
    display: false,
    spacesData: [],
    layout: [],
    tempArray: [],
    compsArray: [],
    modal: false,
    floorPlanId: 0,
    promoterId: 0,
    spaceTypes: [],
    spaceTypeBtns: [],
    selectedSpace: {},
    copyModal: false
  };

  componentDidMount() {
    floorPlanService
      .getFloorPlan(this.props.match.params.eventId)
      .then(this.setLayoutData)
      .then(this.setSpaces)
      .catch(() => _logger("error with EDIT floor plan"));
    spacesService
      .getAllByUserIdSpaceType()
      .then(this.setSpaceTypes)
      .catch(() => _logger("error getting space types"));
  }

  setLayoutData = data => {
    let floorPlanId = data.item.id;
    let promoterId = data.item.promoterId;
    let spacesData = data.item.list;
    let layout = [];
    let tempArray = [];
    for (let i = 0; i < spacesData.length; i++) {
      let obj = JSON.parse(spacesData[i].metaData);
      layout.push(obj.layout);
      tempArray.push(obj.layoutDivs);
    }
    this.setState({ floorPlanId, promoterId, spacesData, layout, tempArray });
  };

  setSpaces = () => {
    let compsArray = this.state.tempArray.map(this.mapSpace);
    this.setState({ compsArray, display: true });
  };

  mapSpace = space => {
    let id = space.props.id;
    let layout = this.state.layout;
    let index = this.searchForIndex(layout, id.toString());
    let spacesData = this.state.spacesData;
    let isSold = spacesData[index].isSold;
    let color = "";
    if (isSold) {
      color = "bg-gray";
    } else {
      color = space.props.className;
    }
    let grid = {
      id: id,
      x: layout[index].x,
      y: layout[index].y,
      w: layout[index].w,
      h: layout[index].h
    };
    return this.makeDiv(color, grid, spacesData[index]);
  };

  setSpaceTypes = data => {
    let spaceTypes = data.items;
    let spaceTypeBtns = spaceTypes.map(this.mapButtons);
    this.setState({ spaceTypes, spaceTypeBtns });
  };

  mapButtons = spaceType => {
    return (
      <button
        className="btn btn-primary btn-xs mr-2"
        id={spaceType.id}
        key={spaceType.id}
        onClick={this.onAddItem}
      >
        {"Add " + spaceType.name}
      </button>
    );
  };

  onAddItem = event => {
    let spaceId = new Date().getTime();
    let spaceTypeId = Number(event.target.id);
    let typeIndex = this.searchForIndex(this.state.spaceTypes, spaceTypeId);
    let spaceType = this.state.spaceTypes[typeIndex];

    let counter = 0;
    let layout = this.state.layout;
    let arr = [];
    for (let i = 0; i < layout.length; i++) {
      if (layout[i].x === 0) {
        let y = layout[i].y;
        arr.push(y);
      }
    }
    for (let j = 0; j < arr.length; ) {
      if (counter === arr[j]) {
        counter += 2;
        j = 0;
      } else {
        j++;
      }
    }

    let updater = prevState => {
      let newSpacePosition = {
        id: spaceId,
        x: 0,
        y: counter,
        w: 1,
        h: 2
      };
      let newSpaceData = {
        id: spaceId,
        typeId: spaceTypeId,
        name: spaceType.name,
        description: spaceType.description || "",
        cost: spaceType.cost,
        isAvailable: true,
        isSold: false
      };

      let newComp = this.makeDiv("bg-info", newSpacePosition, newSpaceData);
      let spacesData = prevState.spacesData.concat([newSpaceData]);
      let compsArray = prevState.compsArray.concat([newComp]);

      let payload = newSpaceData;
      let tempPosition = {
        i: newSpacePosition.id.toString(),
        x: newSpacePosition.x,
        y: newSpacePosition.y,
        w: newSpacePosition.w,
        h: newSpacePosition.h,
        moved: false,
        static: false
      };
      payload.metaData = JSON.stringify({
        layout: tempPosition,
        layoutDivs: newComp
      });
      payload.floorPlanId = this.state.floorPlanId;
      payload.eventId = this.props.match.params.eventId;
      floorPlanService.createSpace(payload);

      return {
        spacesData,
        compsArray
      };
    };
    this.setState(updater);
  };

  updateSpace = (newColor, formData) => {
    let compsArray = [...this.state.compsArray];
    let updatedDiv;
    for (let i = 0; i < compsArray.length; i++) {
      if (compsArray[i].props.id === formData.id) {
        let color = compsArray[i].props.className;
        if (newColor) {
          color = newColor;
        }
        compsArray[i] = this.makeDiv(
          color,
          compsArray[i].props["data-grid"],
          formData
        );
        updatedDiv = compsArray[i];
        _logger("Updated space: ", compsArray[i]);
      }
    }
    let spacesData = [...this.state.spacesData];
    let index = this.searchForIndex(spacesData, formData.id);
    spacesData[index] = formData;

    let layout = [...this.state.layout];
    let newLayout;
    for (let i = 0; i < layout.length; i++) {
      if (layout[i].i === formData.id.toString()) {
        newLayout = {
          i: layout[i].i,
          w: layout[i].w,
          h: layout[i].h,
          x: layout[i].x,
          y: layout[i].y
        };
        if (formData.isAvailable) {
          newLayout.static = false;
        } else {
          newLayout.static = true;
        }
        layout[i] = newLayout;
      }
    }

    this.toggle({
      compsArray,
      spacesData,
      layout
    });

    let payload = {
      id: formData.id,
      description: formData.description,
      cost: formData.cost,
      metaData: JSON.stringify({
        layout: newLayout,
        layoutDivs: updatedDiv
      }),
      isAvailable: formData.isAvailable,
      isSold: formData.isSold
    };
    floorPlanService.updateSpaceData(payload);
  };

  makeDiv = (color, spacePosition, spaceData) => {
    const id = spaceData.id;
    if (spaceData.isAvailable) {
      spacePosition.static = false;
    } else {
      spacePosition.static = true;
    }
    return (
      <div key={id} data-grid={spacePosition} id={id} className={color}>
        <div
          id={id}
          className="space-name text-center"
          onContextMenu={this.onRightClick}
        >
          {spaceData.name}
          <br />
          {"$" + spaceData.cost}
        </div>
        {spaceData.isAvailable ? (
          <div>
            <i
              className="fas fa-times remove-icon"
              onClick={this.onRemoveItem.bind(this, id)}
            />
            <i
              className="fas fa-cog gear-icon"
              onClick={this.handleSettings.bind(this, id)}
            />
          </div>
        ) : !spaceData.isAvailable && !spaceData.isSold ? (
          <span>
            <i
              className="fas fa-cog gear-icon"
              onClick={this.handleSettings.bind(this, id)}
            />
            <i className="fa fa-lock lock-icon" />
          </span>
        ) : (
          <i className="fa fa-lock lock-icon" />
        )}
      </div>
    );
  };

  onRemoveItem = id => {
    let spacesData = [...this.state.spacesData];
    let compsArray = [...this.state.compsArray];
    let index = this.searchForIndex(spacesData, id);
    if (index >= 0) {
      spacesData.splice(index, 1);
      compsArray.splice(index, 1);
      this.setState({ spacesData, compsArray });
    }
    floorPlanService.deleteSpace(id);
  };

  handleSettings = id => {
    let spacesData = [...this.state.spacesData];
    let index = this.searchForIndex(spacesData, id);
    if (index >= 0) {
      this.toggle({ selectedSpace: spacesData[index] });
    }
  };

  onRightClick = e => {
    e.preventDefault();
    let spacesData = [...this.state.spacesData];
    let id = Number(e.target.id);
    let index = this.searchForIndex(spacesData, id);
    this.toggle({
      selectedSpace: spacesData[index]
    });
  };

  searchForIndex = (array, value) => {
    for (let j = 0; j < array.length; j++) {
      if (array[j].i === value) {
        return j;
      } else if (array[j].id === value) {
        return j;
      }
    }
    return -1;
  };

  toggle = xtr => {
    xtr = xtr || {};
    this.setState(prevState => {
      xtr.modal = !prevState.modal;
      return xtr;
    });
  };

  onLayoutChange = layout => {
    this.setState({ layout });
  };

  componentDidUpdate(prevProps, prevState) {
    let id = "";
    if (prevState.layout !== this.state.layout && prevState.layout.length > 0) {
      for (let i = 0; i < this.state.layout.length; i++) {
        for (let j = 0; j < prevState.layout.length; j++) {
          if (this.state.layout[i].i === prevState.layout[j].i) {
            if (
              this.state.layout[i].w !== prevState.layout[j].w ||
              this.state.layout[i].h !== prevState.layout[j].h ||
              this.state.layout[i].x !== prevState.layout[j].x ||
              this.state.layout[i].y !== prevState.layout[j].y
            ) {
              id = this.state.layout[i].i;
              _logger("THIS IS THE ID!! " + id);
              let index = i;
              let payload = {
                id: id,
                metaData: JSON.stringify({
                  layout: this.state.layout[index],
                  layoutDivs: this.state.compsArray[index]
                })
              };
              floorPlanService.updateSpaceLayout(payload);
            }
          }
        }
      }
    }
  }

  toggleCopyModal = () => {
    this.setState(prevState => ({
      copyModal: !prevState.copyModal
    }));
  };

  copyFloorPlan = eventId => {
    let spacesData = this.state.spacesData;
    let spacesLayout = this.state.layout;
    let divsArray = this.state.compsArray;

    for (let i = 0; i < spacesData.length; i++) {
      for (let j = 0; j < spacesLayout.length; j++) {
        for (let k = 0; k < divsArray.length; k++) {
          if (
            spacesData[i].id === Number(spacesLayout[j].i) &&
            Number(spacesLayout[j].i) === divsArray[k].props.id
          ) {
            spacesData[i].metaData = JSON.stringify({
              layout: spacesLayout[j],
              layoutDivs: divsArray[k]
            });
          }
        }
      }
    }
    for (let i = 0; i < spacesData.length; i++) {
      let newSpaceId = new Date().getTime() + i * 100;
      spacesData[i].id = newSpaceId;
      spacesData[i].isSold = false;
      spacesData[i].isAvailable = true;
    }

    let payload = {
      eventId: eventId,
      isLocked: false,
      hasSoldItems: false,
      space: spacesData,
      layerId: 1
    };

    floorPlanService
      .createFloorPlan(payload)
      .then(() => toast("Floor plan copied successfully!"))
      .catch(this.copyError);
  };

  copyError = error => {
    let errorMessage = "Error copying floor plan.";
    if (error.response) {
      if (error.response.data) {
        errorMessage = error.response.data.errors[0];
      }
    }
    toast.error(errorMessage);
  };

  createSpaceType = () => {
    this.props.history.push("/admin/spaces");
  };

  render() {
    return (
      <ContentWrapper>
        {this.state.spaceTypeBtns}
        <div className="float-right">
          <button
            type="button"
            className="btn btn-primary btn-xs mr-2"
            onClick={this.createSpaceType}
          >
            Add Space Type
          </button>
          <button
            type="button"
            className="btn btn-primary btn-xs mr-2"
            onClick={this.toggleCopyModal}
          >
            Copy Floor Plan
          </button>
        </div>
        {this.state.copyModal && (
          <CopyFloorPlanModal
            toggle={this.toggleCopyModal}
            floorPlanId={this.state.floorPlanId}
            promoterId={this.state.promoterId}
            copyFloorPlan={this.copyFloorPlan}
            currentEventId={Number(this.props.match.params.eventId)}
          />
        )}
        <div className="grid-overflow">
          <GridLayout
            cols={24}
            width={2000}
            rowHeight={30}
            compactType={null}
            preventCollision={true}
            isResizable={true}
            layout={this.state.layout}
            onLayoutChange={this.onLayoutChange}
          >
            {this.state.compsArray}
          </GridLayout>
        </div>
        {this.state.modal && (
          <EditSpaceModal
            toggle={this.toggle}
            updateSpace={this.updateSpace}
            selectedSpace={this.state.selectedSpace}
          />
        )}
      </ContentWrapper>
    );
  }
}

EditFloorPlan.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.object
  }),
  history: PropTypes.object
};

export default EditFloorPlan;
