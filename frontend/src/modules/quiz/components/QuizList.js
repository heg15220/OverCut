import React, {useEffect, useState} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import * as selectors from '../selectors';
import * as actions from '../actions';
import QuizQuestions from "./QuizQuestions";
import Grid from "@mui/material/Grid";
import {Pager} from "../../common";


const QuizList = ({user}) => {
    const dispatch = useDispatch();
    const [page, setPage] = useState(0);
    const questions = useSelector(selectors.getQuizQuestions);

    useEffect(() => {
        dispatch(actions.getQuizQuestions({ quizId: 1, page: 0 }, () => {}, () => {})); // Ejemplo, ajusta según sea necesario
    }, [dispatch]);

    const handlePageChange = (newPage) => {
        setPage(newPage);
    };
    return (
        <Grid container spacing={2} justifyContent="center" alignItems="center">
            <Grid item xs={12}> {/* Contenedor para los circuitos y la paginación */}
                <QuizQuestions>questions={questions}</QuizQuestions>
                <Grid container direction="column" alignItems="center" justifyContent="center" sx={{ mt: 2 }}> {/* Contenedor para la paginación */}
                    {questions && (<Pager
                        back={{
                            enabled: page > 0,
                            onClick: () => handlePageChange(page - 1)
                        }}
                        next={{
                            enabled: true,
                            onClick: () => handlePageChange(page + 1)
                        }}
                    />)}
                </Grid>
            </Grid>
        </Grid>
    );
};

export default QuizList;
