import { useEffect, useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { Row, Col, Card, Spinner, Button } from 'react-bootstrap';

export default function Home({ marketplace, nft }) {
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]);

    const loadMarketplaceItems = useCallback(async () => {
        try {
            setLoading(true);
            const itemCount = await marketplace.itemCount();
            const itemsArray = [];
            for (let i = 1; i <= itemCount; i++) {
                const item = await marketplace.items(i);
                if (!item.sold) {
                    const tokenURI = await nft.tokenURI(item.tokenId);
                    const response = await fetch(tokenURI);
                    const metadata = await response.json();
                    const totalPrice = await marketplace.getTotalPrice(item.itemId);
                    const fullItem = {
                        itemId: item.itemId,
                        price: ethers.utils.formatEther(item.price.toString()),
                        totalPrice: ethers.utils.formatEther(totalPrice.toString()),
                        name: metadata.name,
                        description: metadata.description,
                        image: metadata.image,
                    };
                    itemsArray.push(fullItem);
                }
            }
            setItems(itemsArray);
        } catch (error) {
            console.error("Error loading marketplace items:", error);
        } finally {
            setLoading(false);
        }
    }, [marketplace, nft]);

    const purchaseItem = async (item) => {
        try {
            await marketplace.purchaseItem(item.itemId, { value: ethers.utils.parseEther(item.totalPrice) });
            loadMarketplaceItems();  // Refresh the list after purchase
        } catch (error) {
            console.error("Error purchasing item:", error);
        }
    };

    useEffect(() => {
        loadMarketplaceItems();
    }, [loadMarketplaceItems]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <Spinner animation="border" />
                <p className="mx-3 my-0">Loading items...</p>
            </div>
        );
    }

    return (
        <div className="container">
            {items.length > 0 ? (
                <Row xs={1} md={2} lg={4} className="g-4 py-5">
                    {items.map((item, idx) => (
                        <Col key={idx}>
                            <Card>
                                <Card.Img variant="top" src={item.image} style={{ objectFit: 'cover', height: '200px' }} />
                                <Card.Body>
                                    <Card.Title>{item.name}</Card.Title>
                                    <Card.Text>{item.description}</Card.Text>
                                    <Card.Footer>
                                        <Button variant="primary" onClick={() => purchaseItem(item)}>Buy for {item.totalPrice} ETH</Button>
                                    </Card.Footer>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            ) : (
                <div className="text-center">
                    <h2>No items available</h2>
                </div>
            )}
        </div>
    );
}
