import React, { useState, useEffect } from "react";
import { useQuery } from "urql";
import { userSubscribersQuery } from "../helpers/graph";
import SubscriptionsDisplay from "./SubscriptionsDisplay";
import Loading from "./Loading";

const UserSubscribers = ({ address, isLoggedInUser }) => {
    const [allSubscribers, setSubscribers] = useState();
    const [res, executeQuery] = useQuery({
        query: userSubscribersQuery(address)
    });

    useEffect(() => {
        if (
            res &&
            !res.error &&
            !res.fetching &&
            res.data.user &&
            res.data.user.subscribers &&
            res.data.user.subscribers.length
        ) {
            setSubscribers(res.data.user.subscribers);
        }
    }, [res]);

    if (res.fetching) return <Loading />;
    if (res.error) return <p>Errored!</p>;

    return (
        <div className="userSubscribers">
            <span className="profileTitle">Subscribers</span>
            {allSubscribers ? (
                <SubscriptionsDisplay allSubscriptions={allSubscribers} />
            ) : isLoggedInUser ? (
                <p>{"  You have no subscribers"}</p>
            ) : (
                <p>{"  User has no subscribers"}</p>
            )}
        </div>
    );
};

export default UserSubscribers;
