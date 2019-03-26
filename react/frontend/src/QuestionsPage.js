
import React from 'react';
import {addQuestionForm as AddQuestionForm} from './Questions';

class QuestionsPage extends React.Component {
    render() {
        return (
            <div>
                <AddQuestionForm action="/questions/add" />
                <br />
                <hr />
                <br />
                {/* <SearchForm action="/search" /> */}
            </div>
        );
    }
}

export {QuestionsPage};
