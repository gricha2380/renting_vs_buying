import React, { Component } from "react";
import styled from "styled-components";
import _ from "lodash";

import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { changeInput } from "../actions";

const StyledInput = styled.div`
  display: flex;
  flex-flow: row;
`;

const StyledSlider = styled.div`
  flex: 2;
`;

const StyledText = styled.div`
  flex: 1.5;
  margin: 1rem;
`;

const ToolTipText = styled.span`
  visibility: hidden;
  width: 12rem;
  background-color: black;
  color: #fff;
  text-align: center;
  padding: 0.5rem 1rem;
  border-radius: 0.6rem;

  position: absolute;
  z-index: 1;
  top: 50%;
  left: 50%;
  transform: translate(+10%, -50%);

  &:after {
    content: " ";
    position: absolute;
    top: 50%;
    right: 100%; /* To the left of the tooltip */
    margin-top: -0.5rem;
    border-width: 0.5rem;
    border-style: solid;
    border-color: transparent black transparent transparent;
  }
`;

const Info = styled.div`
  margin-left: 0.5rem;
  display: inline-block;
  position: relative

	&:hover {
    ${ToolTipText} {
      visibility: visible;
    }
  }
`;

class InputElement extends Component {
  render() {
    const { label, name, min, max, step, info, unit } = this.props.props;
    const { changeInput, input } = this.props;
    const value = input[name];
    const throttledChangeInput = _.throttle(changeInput, 100)

    return (
      <StyledInput>
        <StyledSlider>
          <div>
            <label htmlFor={name}>{label}</label>
            {info ? (
              <Info>
                <i className="fas fa-info-circle" />
                <ToolTipText>{info}</ToolTipText>
              </Info>
            ) : (
              ""
            )}
          </div>
          <input
            name={name}
            min={min}
            max={max}
            step={step}
            type="range"
            onChange={event =>
              throttledChangeInput({ [name]: Number(event.target.value) })
            }
            value={value}
            style={{ width: "100%" }}
          />
        </StyledSlider>
        <StyledText>
          <input
            name={name}
            type={"number"}
            size={8}
            min={min}
            max={max}
            step={step}
            onChange={event =>
              changeInput({ [name]: Number(event.target.value) })
            }
            value={value}
            style={{ width: "65%" }}
          />
          <label style={{ marginLeft: "0.5rem" }}>{unit}</label>
        </StyledText>
      </StyledInput>
    );
  }
}

const mapDispatchToProps = dispatch => {
  return bindActionCreators({ changeInput: changeInput }, dispatch);
};

function mapStateToProps({ input }) {
  return { input };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(InputElement);
