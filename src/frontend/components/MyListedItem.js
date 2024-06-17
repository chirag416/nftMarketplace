import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { Row, Col, Card, Spinner } from 'react-bootstrap';

function renderSoldItems(items) {
    return (
        <>
            <h2>Sold</h2>
            <Row xs={1} md={2} lg={4} className="g-4 py-3">
                {items.map((item, idx) => (
                    <Col key={idx} className="overflow-hidden">
                        <Card>
                            <Card.Img variant="top" src={item.image} />
                            <Card.Footer>
                                For {ethers.utils.formatEther(item.totalPrice)} ETH - Received {ethers.utils.formatEther(item.price)} ETH
                            </Card.Footer>
                        </Card>
                    </Col>
                ))}
            </Row>
        </>
    );
}

export default function MyListedItems({ marketplace, nft, account }) {
    const [loading, setLoading] = useState(true);
    const [listedItems, setListedItems] = useState([]);
    const [soldItems, setSoldItems] = useState([]);

    const loadListedItems = useCallback(async () => {
        try {
            setLoading(true);
            const itemCount = await marketplace.itemCount();
            const listedItemsArray = [];
            const soldItemsArray = [];
            for (let i = 1; i <= itemCount; i++) {
                const item = await marketplace.items(i);
                if (item.seller.toLowerCase() === account.toLowerCase()) {
                    const tokenURI = await nft.tokenURI(item.tokenId);
                    const response = await fetch(tokenURI);
                    const metadata = await response.json();
                    const totalPrice = await marketplace.getTotalPrice(item.itemId);
                    const listedItem = {
                        totalPrice,
                        price: item.price,
                        itemId: item.itemId,
                        name: metadata.name,
                        description: metadata.description,
                        image: metadata.image,
                    };
                    listedItemsArray.push(listedItem);
                    if (item.sold) {
                        soldItemsArray.push(listedItem);
                    }
                }
            }
            setListedItems(listedItemsArray);
            setSoldItems(soldItemsArray);
        } catch (error) {
            console.error("Error loading listed items:", error);
        } finally {
            setLoading(false);
        }
    }, [marketplace, nft, account]);

    useEffect(() => {
        if (marketplace && nft && account) {
            loadListedItems();
        }
    }, [loadListedItems, marketplace, nft, account]);

    if (loading) {
        return (
            <main style={{ padding: "1rem 0" }}>
                <h2>Loading...</h2>
            </main>
        );
    }

    return (
        <div className="flex justify-center">
            {listedItems.length > 0 ? (
                <div className="px-5 py-3 container">
                    <h2>Listed</h2>
                    <Row xs={1} md={2} lg={4} className="g-4 py-3">
                        {listedItems.map((item, idx) => (
                            <Col key={idx} className="overflow-hidden">
                                <Card>
                                    <Card.Img variant="top" src={item.image} />
                                    <Card.Footer>{ethers.utils.formatEther(item.totalPrice)} ETH</Card.Footer>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                    {soldItems.length > 0 && renderSoldItems(soldItems)}
                </div>
            ) : (
                <main style={{ padding: "1rem 0" }}>
                    <h2>No listed assets</h2>
                </main>
            )}
        </div>
    );
}
