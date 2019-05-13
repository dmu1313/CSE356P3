
import React from 'react';
import { Link } from 'react-router-dom';
import './App.css';


class NavBar extends React.Component {
    render() {
        console.log("Navigation Bar Rendered.");

        let loginButton;
        if (this.props.loggedIn) {
            loginButton = <MyLink className="NavLink" to="/Logout">Logout</MyLink>;
        }
        else {
            loginButton = <MyLink className="NavLink" to="/Login">Login</MyLink>;
        }
        

        return (
            <div className="Nav">
                <div className="EmptyFlex" style={{flexGrow: "3"}}></div>
                <MyLink className="Title" to="/">ArrayOutOfBounds</MyLink>
                <SearchBar className="SearchBar" action="/search"></SearchBar>
                <div className="EmptyFlex" style={{flexGrow: "2"}}></div>
                <MyLink className="NavLink" to="/">Home</MyLink>
                <MyLink className="NavLink" to="/Questions">Questions</MyLink>
                <MyLink className="NavLink" to="/Search">Search</MyLink>
                <MyLink className="NavLink" to="/Media">Media</MyLink>
                <MyLink className="NavLink" to="/Users">Users</MyLink>
                {loginButton}
                <div className="EmptyFlex" style={{flexGrow: "3"}}></div>
            </div>
        );
    }
}

class SearchBar extends React.Component {
    constructor(props) {
        super(props);
        this.state = { value: "" };

        this.handleChange = this.handleChange.bind(this);
        this.search = this.search.bind(this);
    }

    handleChange(event) {
        this.setState({ value: event.target.value });
    }

    search(e) {
        console.log("Search");
        e.preventDefault();

        //fetch for search
        // fetch(this.props.action, )

    }

    render() {
        return (
            <form className="SearchForm" onSubmit={this.search}>
                <input className={this.props.className} type="search" value={this.state.value} onChange={this.handleChange} />
                <input className="button SearchButton" type="submit" value="Search" />
            </form>
        );
    }
}

class MyLink extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return (
        <Link style={{ textDecoration: 'none' }} className={this.props.className} to={this.props.to}>
            {this.props.children}
        </Link>
        );
    }
}

export {NavBar};