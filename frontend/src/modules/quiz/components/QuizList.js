import {Grid} from "@mui/material";
import {useDispatch, useSelector} from "react-redux";
import {useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import * as selectors from "../selectors";
import * as actions from "../actions";
import {Pager} from "../../common";
import QuizQuestions from "./QuizQuestions";
import QuizIntroTypeCategory from './QuizIntroTypeCategory';

const QuizList = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const [currentPage, setCurrentPage] = useState(0);
    const [showIntro, setShowIntro] = useState(true); // control
    const quizType = useSelector(selectors.getQuizQuestionsType);
    const quizCategory = useSelector(selectors.getQuizQuestionsCategory);
    const questions = useSelector(selectors.getQuizQuestions);
    const quiz = useSelector(selectors.findQuiz);

    useEffect(() => {
        if (quiz) {
            dispatch(actions.getQuizQuestionsType(quiz, () => {}, () => {}));
            dispatch(actions.getQuizQuestionsCategory(quiz, () => {}, () => {}));
            dispatch(actions.getQuizQuestions({ quizId: quiz, page: currentPage }, () => {}, () => {}));
        }
    }, [dispatch, quiz, currentPage]);

    const handleContinue = () => {
        setShowIntro(false);
    };

    return (
        <Grid container spacing={2} justifyContent="center" alignItems="center">
            <Grid item xs={12} sx={{ mt: -8 }}>
                {showIntro ? (
                    <QuizIntroTypeCategory
                        quizType={quizType}
                        quizCategory={quizCategory}
                        onContinue={handleContinue}
                    />
                ) : (
                    <QuizQuestions questions={questions} quizType={quizType} />
                )}
            </Grid>
        </Grid>
    );
};
export default QuizList;