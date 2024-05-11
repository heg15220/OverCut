import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { getCircuitsByCategory, getGetCircuits } from '../selectors';
import { Grid, Paper, Typography, Button } from '@mui/material';
import { Pager } from '../../common';
import * as actions from "../actions";
import * as selectors from '../selectors';
import PostListItem from "../../posts/components/PostListItem";
import {FormattedMessage} from "react-intl";
import CircuitListItem from "./CircuitListItem";

const CircuitList = ({circuits}) => {
    return (
        <div>
            {circuits ?
                (<div>
                    <div>{
                        circuits.result.items.map(circuit =>
                            <CircuitListItem key={circuit.circuitId} circuit={circuit} />)
                    }
                    </div>
                </div>) : <FormattedMessage id="project.no_circuits" />}
        </div>
    );

};

export default CircuitList;
