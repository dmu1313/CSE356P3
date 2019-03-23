
import React from 'react';

class Button extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <button className={ this.props.className } onClick={ this.props.callback }>{ this.props.children }</button>
        );
    }

}

export {Button};
