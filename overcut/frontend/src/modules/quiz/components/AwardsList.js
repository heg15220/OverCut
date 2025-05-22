import {Grid} from "@mui/material";
import {useDispatch, useSelector} from "react-redux";
import {useEffect, useState} from "react";
import * as UserSelector from '../../users/selectors';
import * as selectors from "../selectors";
import * as actions from "../actions";
import {Pager} from "../../common";
import AwardItems from "./AwardItems";

const AwardsList = () => {
    const dispatch = useDispatch();
    const [currentPage, setCurrentPage] = useState(0);
    const awards = useSelector(selectors.getAvailableAwards);
    const user = useSelector(UserSelector.getUser);

    useEffect(() => {
        if(user) {
            dispatch(actions.getAvailableAwards({userId: user.id, page: currentPage}, () => {
            }, () => {
            }));
        }
    }, [dispatch, user, currentPage]);

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    return (
        <Grid container spacing={2} justifyContent="center" alignItems="center">
            <Grid item xs={12}>
                <AwardItems awards={awards} />
            </Grid>
        </Grid>
    );
};
export default AwardsList;