
import React from 'react';
import {STATUS_OK, STATUS_ERROR, BUTTON_CLASS} from './Utils';
import { Link } from 'react-router-dom';

class SearchPage extends React.Component {
    constructor(props) {
        super(props);
    }

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
                <SearchForm action="/search" />
            </div>
        );
    }
}



class SearchForm extends React.Component {
    constructor(props) {
        super(props);

        this.state = {notification: "", timestamp: "", limit: "", query: "", sort: "", tags: "", media: false, accepted: false, searchResults: []};
        this.handleChange = this.handleChange.bind(this);
        this.search = this.search.bind(this);
    }

    
    handleChange(event) {
        let name = event.target.name;
        let value;
        if (event.target.type === 'checkbox') {
            value = event.target.checked;
        }
        else {
            value = event.target.value;
        }

        this.setState({ [name]: value });
    }

    search(e) {
        console.log("Search question ---------------------------------------------------");
        e.preventDefault();

        var sendObj = {};
        
        var timestamp = this.state.timestamp;
        if (timestamp !== "") {
            sendObj.timestamp = parseInt(timestamp);
        }

        var limit = this.state.limit;
        if (limit !== "" && parseInt(limit) !== 25) {
            sendObj.limit = parseInt(limit);
        }

        var query = this.state.query;
        if (query !== "") {
            sendObj.q = query;
        }

        var sort = this.state.sort;
        if (sort !== "" && sort !== "score") {
            sendObj.sort_by = sort;
        }

        var tags = this.state.tags;
        if (tags !== "") {
            let tagsArray = tags.split(" ");
            
            sendObj.tags = tagsArray.filter(function(element) {
                return element !== "";
            });
        }

        var media = this.state.media;
        if (media !== false) {
            sendObj.has_media = media;
        }

        var accepted = this.state.accepted;
        if (accepted !== false) {
            sendObj.accepted = accepted;
        }

        console.log(sendObj);
        
        var me = this;
        var success = false;
        var questions;

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
                questions = json.questions;
                me.setState({searchResults: questions});
            }
            else {
                success = false;
                me.setState({ notification: ("Could not perform search. Try again please. Error: " + json.error) });
            }
        })
        .catch(function(error) {
            success = false;
            me.setState({notification: "Failed to search. Error" + error});
            console.log("Failed to search. Error: " + error);
        });

    }

    render() {

        var searchResults = this.state.searchResults;
        var resultsContent;
        if (searchResults && searchResults.length > 0) {
            resultsContent = (
                <div>
                    {searchResults.map((question) => {
                                        return (
                                            <div>
                                                <SearchResult title={question.title} score={question.score} to={'/Question/' + question.id} />
                                                <br />
                                            </div>
                                        );
                                        } )}
                </div>
            );
        }




        return (
            <div>
                <p className="Notification">{this.state.notification}</p>
                <form className="" onSubmit={this.search}>
                    <label>
                        Search Query String:
                        <input className={this.props.className} type="text" name="query" value={this.state.query} onChange={this.handleChange} />
                    </label>
                    <br />
                    <label>
                        Timestamp:
                        <input className={this.props.className} type="number" step="1" name="timestamp" value={this.state.timestamp} onChange={this.handleChange} />
                    </label>
                    <br />
                    <label>
                        Limit:
                        <input className={this.props.className} type="number" step="1" name="limit" value={this.state.limit} onChange={this.handleChange} />
                    </label>
                    <br />
                    <br />
                    <label>
                        Sort By:
                        <br />
                        <label>
                            Score:
                            <input type="radio" name="sort" value="score" checked={this.state.sort === "score"} onChange={this.handleChange} />
                        </label>
                        <br />
                        <label>
                            Timestamp:
                            <input type="radio" name="sort" value="timestamp" checked={this.state.sort === "timestamp"} onChange={this.handleChange} />
                        </label>

                    </label>
                    <br />
                    <br />
                    <label>
                        Tags (space separated):
                        <input className={this.props.className} type="text" name="tags" value={this.state.tags} onChange={this.handleChange} />
                    </label>
                    <br />
                    <label>
                        Has Media:
                        <input className={this.props.className} type="checkbox" name="media" checked={this.state.media === true} onChange={this.handleChange} />
                    </label>
                    <br />
                    <label>
                        Accepted:
                        <input className={this.props.className} type="checkbox" name="accepted" checked={this.state.accepted === true} onChange={this.handleChange} />
                    </label>
                    <br />
                    <input className={BUTTON_CLASS} type="submit" name="SearchButton" value="Search" />
                </form>

                <br />
                <hr />

                {resultsContent}

            </div>
        );
    }
}

class SearchResult extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div>
                {/* <Link style={{ textDecoration: 'none' }} className={this.props.className} to={this.props.to}> */}
                <Link className={this.props.className} to={this.props.to}>
                    {this.props.title}
                </Link>
                <p>Score: {this.props.score}</p>
            </div>
        );
    }
}

export {SearchPage};
