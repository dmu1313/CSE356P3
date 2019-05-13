
import React from 'react';
import { Link, withRouter } from 'react-router-dom';

const STATUS_OK = "OK";
const STATUS_ERROR = "error";
const BUTTON_CLASS = "button ripple";

class QuestionLink extends React.Component {
    render() {
        return (
            <div>
                {/* <Link style={{ textDecoration: 'none' }} className={this.props.className} to={this.props.to}> */}
                <Link className={this.props.className} to={this.props.to}>
                    {this.props.id}
                </Link>
            </div>
        );
    }
}

export {STATUS_OK, STATUS_ERROR, BUTTON_CLASS, QuestionLink};
