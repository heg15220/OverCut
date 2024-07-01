import {Grid} from "@mui/material";
import {useDispatch, useSelector} from "react-redux";
import {useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import * as selectors from "../selectors";
import * as actions from "../actions";
import {Pager} from "../../common";
import QuizQuestions from "./QuizQuestions";

const QuizList = () => {
    const {id} = useParams();
    const dispatch = useDispatch();
    const [currentPage, setCurrentPage] = useState(0);
    const questions = useSelector(selectors.getQuizQuestions);
    const quiz = useSelector(selectors.findQuiz);

    useEffect(() => {
        if(quiz) {
            dispatch(actions.getQuizQuestions({quizId: quiz, page: currentPage}, () => {
            }, () => {
            }));
        }
    }, [dispatch, quiz, currentPage]);

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    return (
        <Grid container spacing={2} justifyContent="center" alignItems="center">
            <Grid item xs={12}>
                <QuizQuestions questions={questions} />
                <Grid container direction="column" alignItems="center" justifyContent="center" sx={{ mt: 2 }}>
                    {questions && (
                        <Pager
                            back={{
                                enabled: currentPage > 0,
                                onClick: () => handlePageChange(currentPage - 1),
                            }}
                            next={{
                                enabled: currentPage < questions.totalPages - 1,
                                onClick: () => handlePageChange(currentPage + 1),
                            }}
                        />
                    )}
                </Grid>
            </Grid>
        </Grid>
    );
};
export default QuizList;