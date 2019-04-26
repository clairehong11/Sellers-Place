import React, { Component } from "react";
import PlacesAutocomplete, {
  geocodeByAddress,
  getLatLng
} from "react-places-autocomplete";
import logger from "../../logger";
import PropTypes from "prop-types";
import SweetAlert from "sweetalert";
import * as vendorsService from "../../services/vendorsService";
import { toast } from "react-toastify";
import PlacesAutocompleteWrapper from "../common/PlacesAutocompleteWrapper";

const _logger = logger.extend("questionnaire");

class VendorLocations extends Component {
  state = {
    city: "",
    citiesData: [],
    formattedCityNames: [],
    searchOptions: {
      types: ["(cities)"],
      componentRestrictions: { country: "us" }
    }
  };

  removeCity = event => {
    const index = event.target.id;
    this.setState(prevState => {
      let citiesData = [...prevState.citiesData];
      let formattedCityNames = [...prevState.formattedCityNames];
      citiesData.splice(index, 1);
      formattedCityNames.splice(index, 1);
      return { citiesData, formattedCityNames };
    });
  };

  renderVendorCities = () => {
    return this.state.formattedCityNames.map((location, index) => {
      return (
        <li key={index}>
          {location}
          <button
            className="btn btn-link"
            onClick={this.removeCity}
            id={index}
            style={{ marginLeft: "1%" }}
          >
            &times;
          </button>
        </li>
      );
    });
  };

  handleChange = city => {
    this.setState({ city });
  };

  handleSelect = city => {
    geocodeByAddress(city)
      .then(this.setCityData)
      .catch(error => _logger("Error", error));
  };

  setCityData = async results => {
    let data = results[0];
    let city = data.formatted_address;
    let latLng = await getLatLng(results[0]);
    _logger(latLng);

    if (city.includes(", USA") && data.types.includes("locality")) {
      for (let i = 0; i < this.state.formattedCityNames.length; i++) {
        if (this.state.formattedCityNames[i] === city) {
          toast.error("You have already selected that city.");
          return;
        }
      }

      this.setState(prevState => {
        let formattedCityNames = [...prevState.formattedCityNames];
        formattedCityNames.push(city);

        let citiesData = [...prevState.citiesData];
        citiesData.push({
          city: city.split(",")[0],
          stateCode: city.split(", ")[1].substring(0, 2),
          latitude: latLng.lat,
          longitude: latLng.lng
        });
        return { formattedCityNames, citiesData };
      });
    } else {
      toast.error("Please select a U.S. city");
    }
  };

  lastStep = () => {
    if (this.props.isPromoter) {
      SweetAlert(
        "Congratulations!",
        "Your cities have been updated",
        "success"
      );
      this.props.nextStep();
    } else {
      SweetAlert("All done!", "Welcome to Seller's Place!", "success");
      const roles = ["Vendor"];
      if (this.props.isVenueOwner) {
        roles.push("Venue Owner");
      }
      this.props.history.push("/admin/dashboard", {
        type: "RESETROLES",
        payload: { roles: roles }
      });
    }
  };

  onSubmit = () => {
    let payload = {};
    payload.vendorId = this.props.vendorId;
    payload.vendorCities = [];

    for (let i = 0; i < this.state.citiesData.length; i++) {
      payload.vendorCities.push(this.state.citiesData[i]);
    }
    vendorsService
      .addVendorLocation(payload)
      .then(this.lastStep)
      .catch(function() {
        _logger("error creating locations");
      });
  };

  onLoad = () => {
    this.setState({ onLoad: true });
  };

  onError = () => {
    this.setState({ onError: true });
  };

  render() {
    return (
      <div className="card mb-3 border-primary">
        <PlacesAutocompleteWrapper
          onLoad={this.onLoad}
          onError={this.onError}
        />
        <div className="card-header text-white bg-primary">
          <h2>3c. Create a Vendor - Locations</h2>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6" style={{ padding: "2%" }}>
              <h4>In which cities would you like to vend?</h4>
              {this.state.onLoad && (
                <PlacesAutocomplete
                  value={this.state.city}
                  onChange={this.handleChange}
                  onSelect={this.handleSelect}
                  searchOptions={this.state.searchOptions}
                >
                  {({
                    getInputProps,
                    suggestions,
                    getSuggestionItemProps,
                    loading
                  }) => (
                    <div>
                      <input
                        {...getInputProps({
                          placeholder: "Search cities ...",
                          className: "location-search-input form-control"
                        })}
                      />
                      <div className="autocomplete-dropdown-container">
                        {loading && <div>Loading...</div>}
                        {suggestions.map(suggestion => {
                          const className = suggestion.active
                            ? "suggestion-item--active"
                            : "suggestion-item";
                          const style = suggestion.active
                            ? { backgroundColor: "#fafafa", cursor: "pointer" }
                            : { backgroundColor: "#fff", cursor: "pointer" };

                          return (
                            <div
                              key
                              {...getSuggestionItemProps(suggestion, {
                                className,
                                style
                              })}
                            >
                              <span>{suggestion.description}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </PlacesAutocomplete>
              )}
            </div>
            {this.state.formattedCityNames[0] && (
              <div className="col-md-6">
                <h4>Your cities: </h4>
                <ul>{this.renderVendorCities()}</ul>
              </div>
            )}
          </div>
          <div style={{ marginTop: "10%" }}>
            <button className="btn btn-primary" onClick={this.onSubmit}>
              {this.props.buttonName}
            </button>
          </div>
        </div>
      </div>
    );
  }
}

VendorLocations.propTypes = {
  nextStep: PropTypes.func,
  buttonName: PropTypes.string.isRequired,
  isPromoter: PropTypes.bool.isRequired,
  isVenueOwner: PropTypes.bool.isRequired,
  history: PropTypes.object,
  vendorId: PropTypes.number.isRequired
};

export default VendorLocations;
