import React from "react";
import { Button, Form, Input } from "reactstrap";
import styles from "./RegForm.module.css";
import Modal from "./RegistrationWidgetModal";
import SweetAlert from "sweetalert";
import * as userService from "../../../services/usersService";
import * as authService from "../../../services/authService";
import * as emailService from "../../../services/inviteEmailService";
import * as tokenService from "../../../services/tokenService";
import PropTypes from "prop-types";
import logger from "../../../logger";
import { withRouter } from "react-router-dom";

const _logger = logger.extend("Registration");

class RegistrationWidget extends React.Component {
  state = {
    isOpen: this.props.isOpen || false,
    regData: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: ""
    },
    userId: 0
  };

  handleInputChange = e => {
    const name = e.target.name;
    const value = e.target.value;
    let regData = { ...this.state.regData };
    if (name === "name") {
      regData["firstName"] = value.split(" ")[0];
      if (!value.split(" ")[1]) {
        regData["lastName"] = "";
      } else {
        regData["lastName"] = value.split(" ")[1];
      }
    } else {
      regData[name] = value;
    }
    this.setState({ regData });
  };

  toggle = () => {
    let isOpen = false;
    this.setState(prevState => {
      isOpen = !prevState.isOpen;
      return { isOpen };
    });
    if (this.props.modalToggled) {
      this.props.modalToggled(isOpen);
    }
  };

  onSubmitRegData = (values, actions) => {
    _logger(values);
    let payload = {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      password: values.password,
      isConfirmed: 0, // not confirmed until they click sendgrid email link
      status: 1, // active status
      avatarUrl:
        "https://sabio-s3.s3.us-west-2.amazonaws.com/sellersplace/8b8c1349-de4e-47ea-98a6-d6d661ba234b_user sillhouette.png"
    };
    this.setState({ regData: values });
    userService
      .add(payload)
      .then(this.submitSuccess)
      .catch(this.submitError);
    actions.setSubmitting(false);
  };

  submitSuccess = data => {
    _logger("UserId: " + data.item);
    this.setState({ userId: data.item });
    const payload = {
      email: this.state.regData.email,
      password: this.state.regData.password
    };
    authService
      .login(payload)
      .then(this.addToken)
      .then(this.sendEmail)
      .then(this.axiosSuccess)
      .catch(this.axiosError);

    this.toggle();
  };

  addToken = () => {
    const payload = {
      tokenTypeId: 1 // 1 for new user token type
    };
    return tokenService.add(payload);
  };

  sendEmail = data => {
    _logger("GUID: ", data.item);
    const payload = {
      to: this.state.regData.email,
      fName: this.state.regData.firstName,
      lName: this.state.regData.lastName,
      token: data.item
    };
    return emailService.sendConfirmation(payload);
  };

  axiosSuccess = response => {
    _logger(response, " axios success!");
    this.props.history.push("/admin/questionnaire", {
      type: "LOGIN",
      payload: {
        id: this.state.userId,
        isLoggedIn: true,
        roles: ["Temporary"],
        name: this.state.regData.email,
        avatarUrl:
          "https://sabio-s3.s3.us-west-2.amazonaws.com/sellersplace/8b8c1349-de4e-47ea-98a6-d6d661ba234b_user sillhouette.png"
      }
    });
    SweetAlert("Woot!", "You are registered", "success");
  };

  axiosError = response => {
    _logger(response, " axios error :( ");
  };

  submitError = error => {
    _logger(error);
    let errorMessage = "Error. Please try again.";
    if (error.response) {
      if (error.response.data) {
        errorMessage = error.response.data.errors[0];
      }
    }
    SweetAlert("Oops!", errorMessage, "error");
  };

  render() {
    return (
      <div>
        <div style={{ display: this.props.isWidget ? "block" : "none" }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Form inline>
              <Input
                className={styles.inputName}
                type="text"
                name="name"
                placeholder="enter name"
                onChange={this.handleInputChange}
              />
              <Input
                className={styles.inputEmail}
                type="email"
                name="email"
                placeholder="enter email address"
                onChange={this.handleInputChange}
              />
              <Button className={styles.submit} onClick={this.toggle}>
                register
              </Button>
            </Form>
          </div>
        </div>
        <Modal
          toggle={this.toggle}
          isOpen={this.state.isOpen}
          regData={this.state.regData}
          onSubmitRegData={this.onSubmitRegData}
        />
      </div>
    );
  }
}

RegistrationWidget.propTypes = {
  history: PropTypes.object,
  isWidget: PropTypes.bool,
  isOpen: PropTypes.bool,
  modalToggled: PropTypes.func
};

export default withRouter(RegistrationWidget);
