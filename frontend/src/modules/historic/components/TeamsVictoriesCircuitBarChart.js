import { useDispatch, useSelector } from "react-redux";
import * as selectors from "../selectors";
import React, { useEffect } from "react";
import * as actions from "../actions";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell, Legend,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";
import { useParams } from "react-router-dom";

const TeamsVictoriesCircuitBarChart = () => {
    const dispatch = useDispatch();
    const { id } = useParams();
    const teamsVictoriesCircuit = useSelector(selectors.getTeamsVictoriesByCircuit);
    const isLoading = useSelector(state => state.isLoading);

    useEffect(() => {
        const circuitId = Number(id);
        if (!Number.isNaN(circuitId) && circuitId !== "undefined") {
            dispatch(actions.getTeamsVictoriesByCircuitName(circuitId, () => {}));
        } else {
            console.error("ID inválido o no definido");
            // Maneja el caso en que el ID sea inválido o no definido
        }
    }, [dispatch, id]);


    const colors = [
        '#FF0000', '#800000', '#FFFF00', '#808000', '#008000', '#004000',
        '#0000FF', '#000080', '#00FFFF', '#008080', '#000088', '#FF00FF', '#800080',
        '#FFFFCC', '#808080', '#00BFFF', '#008080', '#FFD700', '#ADFF2F'
    ];

    // Verifica si los datos están cargando o si no hay datos disponibles
    if (isLoading || !teamsVictoriesCircuit || !teamsVictoriesCircuit.items.length) {
        return <div>Loading...</div>; // Muestra un indicador de carga o retorna temprano
    }

    return (
        <>
            <BarChart
                width={500}
                height={300}
                data={teamsVictoriesCircuit.items}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="teamName" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="victories" fill="#8884d8">
                    {teamsVictoriesCircuit.items.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                </Bar>
            </BarChart>
        </>
    );
};

export default TeamsVictoriesCircuitBarChart;
