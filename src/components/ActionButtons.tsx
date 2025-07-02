import React from 'react';
import { Button } from 'react-bootstrap';
import { FaEdit, FaTrash } from 'react-icons/fa';

export interface ActionButtonsProps<T extends { id?: number }> {
    rowData: T;
    onEdit?: (row: T) => void;
    onDelete?: (id?: number) => void;
    showEdit?: boolean;
    showDelete?: boolean;
    iconColor?: string;
    iconSize?: number;
}

function ActionButtons<T extends { id?: number }>({
    rowData,
    onEdit,
    onDelete,
    showEdit = true,
    showDelete = true,
    iconColor = "#555",
    iconSize = 16,
}: ActionButtonsProps<T>) {
    return (
        <>
            {showEdit && onEdit && (
                <Button
                    variant="none"
                    className="icon-button"
                    onClick={() => onEdit(rowData)}
                    title="Edit"
                >
                    {FaEdit({ size: 16, color: "#555", style: { marginRight: "4px" } })}
                </Button>
            )}
            {showDelete && onDelete && (
                <Button
                    variant="none"
                    className="icon-button"
                    onClick={() => onDelete(rowData.id)}
                    title="Delete"
                >
                    {FaTrash({ size: 16, color: "#555", style: { marginRight: "4px" } })}
                </Button>
            )}
        </>
    );
}

export default ActionButtons;
