
import React from 'react';
import {addQuestionForm as AddQuestionForm} from './Questions';

class QuestionsPage extends React.Component {

    componentDidMount() {
        var me = this;
        this.props.getLoginStatus()
        .then(function(status) {
            if (status !== me.props.loggedIn) {
                me.props.setLoginState(status);
            }
        })
        .catch(function(error) {
            console.log("Error getting login status: " + error);
        });
    }
    
    render() {
        return (
            <div>
                <AddQuestionForm action="/questions/add" />
                <br />
                <hr />
                <br />
            </div>
        );
    }
}

export {QuestionsPage};
