

import React from 'react';
import { Link, withRouter } from 'react-router-dom';

import {Button} from './Button.jsx';

import {STATUS_OK, STATUS_ERROR, BUTTON_CLASS, QuestionLink} from './Utils';


class AddQuestionForm extends React.Component {
    constructor(props) {
        super(props);

        this.state = {notification: "", newQuestionPage: ""};
        this.handleChange = this.handleChange.bind(this);
        this.addQuestion = this.addQuestion.bind(this);
    }

    
    handleChange(event) {
        let name = event.target.name;
        let value = event.target.value;
        this.setState({ [name]: value });
    }

    addQuestion(e) {
        console.log("Add question");
        e.preventDefault();

        var tagsArray;
        if (this.state.tags != null && this.state.tags !== "") {
            tagsArray = this.state.tags.split(" ");
        }

        var mediaArray;
        if (this.state.media != null && this.state.media !== "") {
            mediaArray = this.state.media.split(" ");
        }

        var sendObj = { title: this.state.title, body: this.state.body };

        if (tagsArray != null) {
            sendObj.tags = tagsArray;
        }

        if (mediaArray != null) {
            sendObj.media = mediaArray;
        }

        var me = this;
        var success = false;
        var questionId = "";

        fetch(this.props.action, {
            method: "POST",
            credentials: 'include',
            mode: "cors",
            cache: "no-cache",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(sendObj)
        })
        .then(function (response) {
            return response.json();
        })
        .then(function(json) {
            if (json.status === STATUS_OK) {
                success = true;
                questionId = json.id;
            }
            else {
                success = false;
                me.setState({ notification: ("Could not add question. Try again please. Error: " + json.error) });
            }
        })
        .catch(function(error) {
            success = false;
            console.log("Catch: Failed to add question. Error: " + error);
            me.setState({notification: "Failed to add  question. Error: " + error});
        })
        .finally(function() {
            if (success) {
                // me.props.history.push('/Question/' + questionId);
                me.setState({newQuestionPage: questionId});
            }
        });

    }

    render() {

        var questionId = this.state.newQuestionPage;
        var newQuestionLink;
        if (questionId != null && questionId !== "") {
            newQuestionLink = (
                                <div>
                                    <p>Your new question can be found at</p>
                                    <QuestionLink id={questionId} to={'/Question/' + questionId} />
                                </div>
                            );
        }
        else {
            newQuestionLink = null;
        }
        
        return (
            <div>
                <p className="Notification">{this.state.notification}</p>
                <form className="" onSubmit={this.addQuestion}>
                    <label>
                        Title:
                        <input className={this.props.className} type="text" name="title" value={this.state.title} onChange={this.handleChange} />
                    </label>
                    <br />
                    <label>
                        Body:
                        <textarea className={this.props.className} name="body" value={this.state.body} onChange={this.handleChange} />
                    </label>
                    <br />
                    <label>
                        Tags (space separated):
                        <input className={this.props.className} type="text" name="tags" value={this.state.tags} onChange={this.handleChange} />
                    </label>
                    <br />
                    <label>
                        Media IDs (space separated):
                        <input className={this.props.className} type="text" name="media" value={this.state.media} onChange={this.handleChange} />
                    </label>
                    <br />
                    <input className={BUTTON_CLASS} type="submit" value="Add Question" />
                </form>
                <br />
                <br />
                
                {newQuestionLink}

            </div>
        );
    }
}




class QuestionPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {id: 0, user: null, title:"", body:"", score:0, view_count:0, answer_count:0, timestamp:0,
                        media:null, tags:null, accepted_answer_id:null, answers: null};

        this.refresh_visible = false;


        this.answerAdded = this.answerAdded.bind(this);
        this.deleteQuestion = this.deleteQuestion.bind(this);
        this.refresh = this.refresh.bind(this);
        this.getData = this.getData.bind(this);
        this.vote = this.vote.bind(this);
    }

    answerAdded() {
        console.log("QuestionPage: An answer was added.");
        this.refresh_visible = true;
        this.setState(this.state);
    }

    refresh() {
        this.getData();
        // this.setState(this.state);
        //this.setState({refresh_visible: false});
    }

    getData() {
        var success = false;
        var me = this;
        var newState = {};
        
        let questionId = this.props.match.params.id;

        fetch('/questions/' + questionId, {
            method: "GET",
            credentials: 'include',
            mode: "cors",
            cache: "no-cache"
        })
        .then(function (response) {
            return response.json();
        })
        .then(function(json) {
            if (json.status === STATUS_OK) {
                success = true;
                newState = json.question;
                // me.setState(json.question);
            }
            else {
                success = false;
                me.setState({errorMessage: json.error});
            }
        
            return fetch("/questions/" + questionId + "/answers", {
                method: "GET",
                credentials: 'include',
                mode: "cors",
                cache: "no-cache",
                headers: {
                    "Content-Type": "application/json"
                }
            });
        })
        .then(function (response) {
            return response.json();
        })
        .then(function(json) {
            console.log("Getting answers");
            if (json.status === STATUS_OK) {
                success = true;
                newState.answers = json.answers;
            }
            else {
                success = false;
                me.setState({ notification: ("Could not get answers for questionId: " + questionId + ". Error: " + json.error) });
            }
        })
        .catch(function(error) {
            success = false;
            me.setState({notification: "Failed to get answers for question " + questionId + ", Error: " + error});
            console.log("Catch: Failed to get answers. Error: " + error);
        })
        .finally(function() {
            if (success) {
                me.setState(newState);
            }
        });
    }

    componentDidMount() {
        this.getData();
    }

    deleteQuestion(e) {
        console.log("Delete question");
        e.preventDefault();

        var me = this;
        var success = false;
        var questionId = this.props.match.params.id;

        fetch('/questions/' + questionId, {
            method: "DELETE",
            credentials: 'include',
            mode: "cors",
            cache: "no-cache"
        })
        .then(function (response) {
            return response.json();
        })
        .then(function(json) {
            if (json.status === STATUS_OK) {
                success = true;                
            }
            else {
                success = false;
                me.setState({ notification: ("Could not delete question. Try again please. Error: " + json.error) });
            }
        })
        .catch(function(error) {
            success = false;
            me.setState({ notification: ("Failed to delete question. Error: " + error) });
            console.log("Failed to delete question. Error: " + error);
        })
        .finally(function() {
            if (success) {
                me.props.history.push('/');
            }
        });
    }

    vote(id, upvote) {
        var me = this;
        var success = false;

        var sendObj = {};
        if (upvote === true) {
        }
        else if (upvote === false) {
            sendObj.upvote = false;
        }

        fetch('/questions/' + id + '/upvote', {
            method: "POST",
            credentials: 'include',
            mode: "cors",
            cache: "no-cache",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(sendObj)
        })
        .then(function (response) {
            return response.json();
        })
        .then(function(json) {
            if (json.status === STATUS_OK) {
                success = true;
            }
            else {
                success = false;
                me.setState({ notification: ("Could not upvote/downvote question.") });
            }
        })
        .catch(function(error) {
            success = false;
            me.setState({ notification: ("Failed to upvote/downvote question. Error: " + error) });
            console.log("Failed to upvote/downvote question. Error: " + error);
        })
        .finally(function() {
            if (success) {
                me.refresh();
                // me.setState({notification: "Upvoted/Downvoted question with ID: " + id});
            }
        });
    }

    render() {
        console.log(this.state);
        if (this.state.id !== 0) {
            var refreshButton;
            if (this.refresh_visible === true) {
                refreshButton = (
                    <button className="button ripple" onClick={this.refresh}>Refresh</button>
                );
                this.refresh_visible = false;
            }
            else {
                refreshButton = null;
            }

            var mediaDisplay;
            if (this.state.media != null && this.state.media.length > 0) {
                mediaDisplay = this.state.media.map((mediaId) => {
                    return (
                        <div>
                            <img src={'/media/' + mediaId} />
                        </div>
                    );
                });
            }

            return (
                <div>
                    <p className="Notification">{this.state.notification}</p>
                    <form className="" onSubmit={this.deleteQuestion}>
                        <input className={BUTTON_CLASS} type="submit" value="Delete Question" />
                    </form>

                    

                    <p>Question ID: {this.state.id}</p>
                    <p>Title: {this.state.title}</p>
                    <br />
                    <p>{this.state.body}</p>

                    <br />
                    <p>Media: </p>
                    {mediaDisplay}


                    <br />
                    <br />
                    <p>Score: {this.state.score}</p>
                    <p>Views: {this.state.view_count}</p>
                    <p>Posted by: {this.state.user.username}</p>
                    <p>Reputation: {this.state.user.reputation}</p>
                    <p>Time Posted: {this.state.timestamp}</p>
                    <p>Tags: {this.state.tags}</p>
                    <p>Accepted Answer ID: {this.state.accepted_answer_id}</p>
                    <br />
                    <br />
                    <p>Number of answers: {this.state.answer_count}</p>

                    <br />
                    <button className="button ripple" onClick={() => this.vote(this.state.id, true)}>Upvote</button>
                    <br />
                    <button className="button ripple" onClick={() => this.vote(this.state.id, false)}>Downvote</button>
                    <br />

                    <br />
                    <hr />

                    <p>Add answer: </p>

                    {refreshButton}
                    
                    <AddAnswerForm action={"/questions/" + this.props.match.params.id + "/answers/add"} callback={this.answerAdded} />

                    <br />
                    <hr />

                    <Answers questionId={this.props.match.params.id} answers={this.state.answers} callback={this.refresh} />

                </div>
            );
        }
        else if (this.state.errorMessage != null) {
            return (
                <div>
                    <p className="Notification">{this.state.errorMessage}</p>
                </div>
            );
        }
        else {
            console.log("Hi");
            return (
                <div></div>
            );
        }
    }
}

class Answers extends React.Component {
    constructor(props) {
        super(props);
        this.state= {notification: ""};
    }

    acceptAnswer(id) {
        console.log("Accept Answer ID: " + id);
        var me = this;
        var success = false;

        fetch('/answers/' + id + '/accept', {
            method: "POST",
            credentials: 'include',
            mode: "cors",
            cache: "no-cache"
        })
        .then(function (response) {
            return response.json();
        })
        .then(function(json) {
            if (json.status === STATUS_OK) {
                success = true;
            }
            else {
                success = false;
                me.setState({ notification: ("Could not accept answer.") });
            }
        })
        .catch(function(error) {
            success = false;
            me.setState({ notification: ("Failed to accept answer. Error: " + error) });
            console.log("Failed to accept answer. Error: " + error);
        })
        .finally(function() {
            if (success) {
                me.setState({notification: "Accepted answer with ID: " + id});
            }
        });
    }

    vote(id, upvote) {
        var me = this;
        var success = false;

        var sendObj = {};
        if (upvote === true) {
        }
        else if (upvote === false) {
            sendObj.upvote = false;
        }

        fetch('/answers/' + id + '/upvote', {
            method: "POST",
            credentials: 'include',
            mode: "cors",
            cache: "no-cache",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(sendObj)
        })
        .then(function (response) {
            return response.json();
        })
        .then(function(json) {
            if (json.status === STATUS_OK) {
                success = true;
            }
            else {
                success = false;
                me.setState({ notification: ("Could not upvote/downvote answer.") });
            }
        })
        .catch(function(error) {
            success = false;
            me.setState({ notification: ("Failed to upvote/downvote answer. Error: " + error) });
            console.log("Failed to upvote/downvote answer. Error: " + error);
        })
        .finally(function() {
            if (success) {
                me.props.callback();
                // me.setState({notification: "Upvoted/Downvoted answer with ID: " + id});
            }
        });
    }

    render() {
        if (this.props.answers) {
            return (
                <div>
                    <p className="Notification">{this.state.notification}</p>
                    {this.props.answers.map((answer) => {
                                        return (
                                            <React.Fragment>
                                            <Answer id={answer.id} body={answer.body} user={answer.user} media={answer.media}
                                            score={answer.score} is_accepted={answer.is_accepted} timestamp={answer.timestamp} />

                                            <br />
                                            <button className="button ripple" onClick={() => this.vote(answer.id, true)}>Upvote</button>
                                            <br />
                                            <button className="button ripple" onClick={() => this.vote(answer.id, false)}>Downvote</button>
                                            <br />
                                            <button className="button ripple" onClick={() => this.acceptAnswer(answer.id)}>Accept Answer</button>
                                            <br />
                                            <hr />
                                            </React.Fragment>
                                        );
                                        } )}
                </div>
            );
        }
        else {
            return (
                <div>
                    <p className="Notification">{this.state.notification}</p>
                </div>
            );
        }
    }
}

class Answer extends React.Component {
    render() {
        var accepted;
        if (this.props.is_accepted === true) {
            accepted = "True";
        }
        else {
            accepted = "False";
        }

        var mediaDisplay;
        if (this.props.media != null && this.props.media.length > 0) {
            mediaDisplay = this.props.media.map((mediaId) => {
                return (
                    <div>
                        <img src={'/media/' + mediaId} />
                    </div>
                );
            });
        }

        return(
            <div>
                <p>{this.props.body}</p>
                <p>Answer ID: {this.props.id}</p>
                <p>Username: {this.props.user}</p>
                <p>Score: {this.props.score}</p>
                <p>Accepted: {accepted}</p>
                <p>Timestamp: {this.props.timestamp}</p>


                <p>Media: </p>
                {mediaDisplay}


                <br />
                {/* <p>Media: {this.props.media}</p> */}

            </div>
        );
    }
}



class AddAnswerForm extends React.Component {
    constructor(props) {
        super(props);

        this.state = {body:""};

        this.handleChange = this.handleChange.bind(this);
        this.addAnswer = this.addAnswer.bind(this);
    }
    
    handleChange(event) {
        let name = event.target.name;
        let value = event.target.value;
        this.setState({ [name]: value });
    }

    addAnswer(e) {
        console.log("Add answer");
        e.preventDefault();
        
        var mediaArray;
        if (this.state.media != null && this.state.media !== "") {
            mediaArray = this.state.media.split(" ");
        }

        var sendObj = { body: this.state.body };

        if (mediaArray != null) {
            sendObj.media = mediaArray;
        }

        var me = this;
        var success = false;
        var answerId = "";

        fetch(this.props.action, {
            method: "POST",
            credentials: 'include',
            mode: "cors",
            cache: "no-cache",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(sendObj)
        })
        .then(function (response) {
            return response.json();
        })
        .then(function(json) {
            if (json.status === STATUS_OK) {
                success = true;
                answerId = json.id;
            }
            else {
                success = false;
            }
        })
        .catch(function(error) {
            success = false;
            console.log("Catch: Failed to add answer. Error: " + error);
        })
        .finally(function() {
            if (success) {
                me.props.callback();
            }
            else {
                me.setState({notification: "Could not add answer."})
            }
        });

    }

    render() {


        return (
            <div>
                <p className="Notification">{this.state.notification}</p>
                <form className="" onSubmit={this.addAnswer}>
                    <label>
                        Answer:
                        <textarea className={this.props.className} name="body" value={this.state.body} onChange={this.handleChange} />
                    </label>
                    <br />
                    <label>
                        Media IDs (space separated):
                        <input className={this.props.className} type="text" name="media" value={this.state.media} onChange={this.handleChange} />
                    </label>
                    <br />
                    <input className={BUTTON_CLASS} type="submit" value="Add Answer" />
                </form>
            </div>
        );
    }
}

const addQuestionForm = withRouter(AddQuestionForm);
const questionPage = withRouter(QuestionPage);


export {questionPage, addQuestionForm};
