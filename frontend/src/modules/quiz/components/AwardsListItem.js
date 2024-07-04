import React from 'react';
import AwardDetailsLink from "./AwardDetailsLink";

const AwardsListItem = ({ award }) => {
    return (
        <div className="card my-2" style={{ position: 'relative', paddingRight: '120px' }}>
            <div className="card-body">
                <AwardDetailsLink id={award.id} name={award.award} />
            </div>
        </div>
    )
}

export default AwardsListItem;