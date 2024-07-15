import {useDispatch, useSelector} from "react-redux";
import * as selectors from "../selectors";
import React, {useEffect} from "react";
import * as actions from "../actions";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    LabelList,
    Legend,
    Pie,
    PieChart,
    Sector,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";
import {useParams} from "react-router-dom";
import {getTeamsVictoriesByCircuitName} from "../actions";

const TeamsVictoriesCircuitBarChart = () => {
    const dispatch = useDispatch();
    const {id} = useParams();
    const teamsVictoriesCircuit = useSelector(selectors.getTeamsVictoriesByCircuit);
    const circuit = useSelector(selectors.getCircuit);
    const isLoading = useSelector(state => state.isLoading);

    useEffect(() => {
        const circuitId = Number(id);
        if (!Number.isNaN(circuitId)){
        dispatch(actions.fetchCircuitDetails(circuitId,()=> {}))}
    }, [dispatch, id]);

    useEffect(() => {
            dispatch(actions.getTeamsVictoriesByCircuitName({circuitName:circuit.name},() => {
            }, () => {}));
        }, [dispatch,circuit]);




    const colors = [
        '#FF0000', '#800000', '#FFFF00', '#808000', '#008000', '#004000',
        '#0000FF', '#000080', '#00FFFF', '#008080', '#000088', '#FF00FF', '#800080',
        '#FFFFCC', '#808080', '#00BFFF', '#008080', '#FFD700', '#ADFF2F'
    ];



    // Transforma los datos para la gráfica circular


    return (
        <>
            <BarChart
                width={500}
                height={300}
                data={teamsVictoriesCircuit}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="teamName" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="victories" fill="#8884d8">
                    {teamsVictoriesCircuit.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                </Bar>
            </BarChart>

        </>
    );
};

export default TeamsVictoriesCircuitBarChart;
