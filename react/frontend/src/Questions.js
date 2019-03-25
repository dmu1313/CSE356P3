

import React from 'react';
import { withRouter } from 'react-router-dom';

import {STATUS_OK, STATUS_ERROR, BUTTON_CLASS} from './Utils';

class QuestionsPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = { email: "", key: "", notification: "" };

        this.handleChange = this.handleChange.bind(this);
        this.verifyAccount = this.verifyAccount.bind(this);
    }

    handleChange(event) {

    }

    render() {
        return (
            <div>
                
            </div>
        );
    }
}

export {QuestionsPage};
