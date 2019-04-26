import React, { Component } from "react";
import ContentWrapper from "../layout/ContentWrapper";
import StepWizard from "react-step-wizard";
import UserRoleForm from "./FormWizardUserRoleForm";
import BusinessTypeForm from "./FormWizardBusinessType";
import NewBusinessForm from "./FormWizardNewBusiness";
import NewVendorForm from "../vendors/VendorForm";
import VendorExtraInfo from "./VendorExtraInfo";
import VendorLocations from "./VendorPossibleLocations";
import NewPromoterForm from "../promoters/CreatePromoter";
import * as offeringsService from "../../services/offeringsService";
import * as locationsService from "../../services/locationsService";
import logger from "../../logger";
import PropTypes from "prop-types";

const _logger = logger.extend("questionnaire");

class Questionnaire extends Component {
  state = {
    isVenueOwner: false,
    isVendor: false,
    isPromoter: false,
    businessTypeId: 0,
    businessId: 0,
    isEntertainer: false,
    offeringsList: [],
    vendorFormData: {
      name: "",
      description: "",
      headline: "",
      priceMin: "",
      priceMax: "",
      vendorOfferings: []
    },
    vendorId: 0,
    states: []
  };

  componentDidMount() {
    offeringsService
      .getAll()
      .then(this.setOfferingsData)
      .catch(function() {
        _logger("error with vendor offerings");
      });

    this.loadStates();
  }

  loadStates = () => {
    locationsService
      .readStates()
      .then(this.mapStates)
      .catch(this.statesError);
  };

  mapStates = data => {
    const states = data.items.map(state => (
      <option value={state.id} key={state.id}>
        {state.name}
      </option>
    ));
    this.setState({
      states
    });
  };

  setOfferingsData = data => {
    this.setState(prevState => {
      let offeringsList = [...prevState.offeringsList];
      offeringsList = data.item;
      _logger(offeringsList);

      return { offeringsList };
    });
  };

  venueOwnerCheck = () => {
    this.setState(prevState => ({
      isVenueOwner: !prevState.isVenueOwner
    }));
  };

  vendorCheck = () => {
    this.setState(prevState => ({
      isVendor: !prevState.isVendor
    }));
  };

  promoterCheck = () => {
    this.setState(prevState => ({
      isPromoter: !prevState.isPromoter
    }));
  };

  getBusinessType = event => {
    let value = Number(event.target.value);
    _logger(value);
    this.setState({ businessTypeId: value });
  };

  getBusinessId = businessId => {
    _logger("Business id: " + businessId);
    this.setState({ businessId });
  };

  handleEntertainerCheckbox = () => {
    this.setState(prevState => ({
      isEntertainer: !prevState.isEntertainer
    }));
  };

  getVendorFormData = vendorFormData => {
    this.setState({ vendorFormData });
  };

  getVendorId = vendorId => {
    _logger("Vendor id: " + vendorId);
    this.setState({ vendorId });
  };

  renderVendorForms = () => {
    return (
      <StepWizard>
        <UserRoleForm
          venueOwnerCheck={this.venueOwnerCheck}
          vendorCheck={this.vendorCheck}
          promoterCheck={this.promoterCheck}
        />
        <BusinessTypeForm getBusinessType={this.getBusinessType} />
        <NewBusinessForm
          businessTypeId={this.state.businessTypeId}
          getBusinessId={this.getBusinessId}
          states={this.state.states}
        />
        <NewVendorForm
          vendorFormData={this.state.vendorFormData}
          getVendorFormData={this.getVendorFormData}
          offeringsList={this.state.offeringsList}
          handleEntertainerCheckbox={this.handleEntertainerCheckbox}
        />
        <VendorExtraInfo
          offerings={this.state.offeringsList}
          businessId={this.state.businessId}
          isEntertainer={this.state.isEntertainer}
          vendorFormData={this.state.vendorFormData}
          getVendorId={this.getVendorId}
        />
        <VendorLocations
          buttonName={"Finish"}
          isPromoter={this.state.isPromoter}
          isVenueOwner={this.state.isVenueOwner}
          vendorId={this.state.vendorId}
          history={this.props.history}
        />
      </StepWizard>
    );
  };

  renderPromoterForms = () => {
    return (
      <StepWizard>
        <UserRoleForm
          venueOwnerCheck={this.venueOwnerCheck}
          vendorCheck={this.vendorCheck}
          promoterCheck={this.promoterCheck}
        />
        <BusinessTypeForm getBusinessType={this.getBusinessType} />
        <NewBusinessForm
          businessTypeId={this.state.businessTypeId}
          getBusinessId={this.getBusinessId}
          states={this.state.states}
        />
        <NewPromoterForm
          formNumber={3}
          businessId={this.state.businessId}
          history={this.props.history}
          isVendor={this.state.isVendor}
          isVenueOwner={this.state.isVenueOwner}
        />
      </StepWizard>
    );
  };

  renderVendorPromoterForms = () => {
    return (
      <StepWizard>
        <UserRoleForm
          venueOwnerCheck={this.venueOwnerCheck}
          vendorCheck={this.vendorCheck}
          promoterCheck={this.promoterCheck}
        />
        <BusinessTypeForm getBusinessType={this.getBusinessType} />
        <NewBusinessForm
          businessTypeId={this.state.businessTypeId}
          getBusinessId={this.getBusinessId}
          states={this.state.states}
        />
        <NewVendorForm
          vendorFormData={this.state.vendorFormData}
          getVendorFormData={this.getVendorFormData}
          offeringsList={this.state.offeringsList}
          handleEntertainerCheckbox={this.handleEntertainerCheckbox}
        />
        <VendorExtraInfo
          offerings={this.state.offeringsList}
          businessId={this.state.businessId}
          isEntertainer={this.state.isEntertainer}
          vendorFormData={this.state.vendorFormData}
          getVendorId={this.getVendorId}
        />
        <VendorLocations
          buttonName={"Continue"}
          isPromoter={this.state.isPromoter}
          isVenueOwner={this.state.isVenueOwner}
          vendorId={this.state.vendorId}
        />
        <NewPromoterForm
          formNumber={4}
          businessId={this.state.businessId}
          history={this.props.history}
          isVendor={this.state.isVendor}
          isVenueOwner={this.state.isVenueOwner}
        />
      </StepWizard>
    );
  };

  renderVenueOwnerForm = () => {
    return (
      <StepWizard>
        <UserRoleForm
          venueOwnerCheck={this.venueOwnerCheck}
          vendorCheck={this.vendorCheck}
          promoterCheck={this.promoterCheck}
          history={this.props.history}
        />
        <BusinessTypeForm />
      </StepWizard>
    );
  };

  render() {
    return (
      <ContentWrapper>
        <div className="content-heading">Questionnaire</div>
        {this.state.isVendor && !this.state.isPromoter
          ? this.renderVendorForms()
          : this.state.isPromoter && !this.state.isVendor
          ? this.renderPromoterForms()
          : this.state.isVendor && this.state.isPromoter
          ? this.renderVendorPromoterForms()
          : this.renderVenueOwnerForm()}
      </ContentWrapper>
    );
  }
}

Questionnaire.propTypes = {
  history: PropTypes.object
};

export default Questionnaire;
