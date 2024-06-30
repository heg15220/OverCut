import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import * as selectors from '../selectors';
import * as actions from '../actions';
import QuizQuestions from "./QuizQuestions";
import Grid from "@mui/material/Grid";
import { Pager } from "../../common";
import {useNavigate, useParams} from 'react-router-dom';

const QuizList = () => {
    const {id} = useParams();
    const dispatch = useDispatch();
    const [page, setPage] = useState(0);
    const questions = useSelector(selectors.getQuizQuestions);
    const quiz = useSelector(selectors.findQuiz);
    useEffect(() => {
        if(quiz) {
            dispatch(actions.getQuizQuestions({quizId: quiz, page: page}, () => {
            }, () => {
            }));
        }

    }, [dispatch, quiz,page]);

    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    return (
        <Grid container spacing={2} justifyContent="center" alignItems="center">
            <Grid item xs={12}>
                <QuizQuestions questions={questions} />
                <Grid container direction="column" alignItems="center" justifyContent="center" sx={{ mt: 2 }}>
                    {questions && (
                        <Pager
                            back={{
                                enabled: page > 0,
                                onClick: () => handlePageChange(page - 1),
                            }}
                            next={{
                                enabled: true,
                                onClick: () => handlePageChange(page + 1),
                            }}
                        />
                    )}
                </Grid>
            </Grid>
        </Grid>
    );
};

export default QuizList;
