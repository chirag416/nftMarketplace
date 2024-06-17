import React, { useState } from 'react';
import { ethers } from "ethers";
import { Row, Form, Button } from 'react-bootstrap';
import axios from 'axios';

// Pinata configuration
const PINATA_API_KEY = '3b7a1e1a4ca09f65526c';
const PINATA_SECRET_KEY = 'd74531fd7fecbfb3f7fe0171c0705ac3e65b29ab82cd07fd2ac388561c807cb5';

const pinataAPIKey = PINATA_API_KEY;
const pinataSecretApiKey = PINATA_SECRET_KEY;
const pinataUrl = 'https://api.pinata.cloud';

console.log(PINATA_API_KEY);

const Create = ({ marketplace, nft }) => {
  const [image, setImage] = useState('');
  const [price, setPrice] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const uploadToPinata = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const options = {
      headers: {
        'Content-Type': 'multipart/form-data',
        'pinata_api_key': pinataAPIKey,
        'pinata_secret_api_key': pinataSecretApiKey
      }
    };

    try {
      const response = await axios.post(`${pinataUrl}/pinning/pinFileToIPFS`, formData, options);
      return response.data.IpfsHash;
    } catch (error) {
      console.log("Pinata image upload error: ", error);
      throw error;
    }
  };

  const uploadMetadataToPinata = async (metadata) => {
    const options = {
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': pinataAPIKey,
        'pinata_secret_api_key': pinataSecretApiKey
      }
    };

    try {
      const response = await axios.post(`${pinataUrl}/pinning/pinJSONToIPFS`, metadata, options);
      return response.data.IpfsHash;
    } catch (error) {
      console.log("Pinata metadata upload error: ", error);
      throw error;
    }
  };

  const createNFT = async () => {
    if (!image || !price || !name || !description) return;

    try {
      const imageHash = await uploadToPinata(image);
      const metadata = {
        image: `https://gateway.pinata.cloud/ipfs/${imageHash}`,
        name,
        description
      };

      const metadataHash = await uploadMetadataToPinata(metadata);
      await mintThenList(metadataHash);
    } catch (error) {
      console.log("NFT creation error: ", error);
    }
  };

  const mintThenList = async (metadataHash) => {
    const uri = `https://gateway.pinata.cloud/ipfs/${metadataHash}`;

    try {
      // Mint NFT
      console.log('Minting NFT with URI:', uri);
      const mintTx = await nft.mint(uri);
      await mintTx.wait();
      console.log('Mint transaction:', mintTx);

      // Get tokenId of new NFT
      const id = await nft.tokenCount();
      console.log('Token ID:', id.toString());

      // Approve marketplace to spend NFT
      console.log('Setting approval for marketplace...');
      const approveTx = await nft.setApprovalForAll(marketplace.address, true);
      await approveTx.wait();
      console.log('Approval transaction:', approveTx);

      // Add NFT to marketplace
      const listingPrice = ethers.utils.parseEther(price.toString());
      console.log('Creating marketplace item with listing price:', listingPrice.toString());
      const listTx = await marketplace.makeItem(nft.address, id, listingPrice);
      await listTx.wait();
      console.log('List transaction:', listTx);
    } catch (error) {
      console.error('Mint and list error:', error);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImage(file);
    }
  };

  return (
    <div className="container-fluid mt-5">
      <div className="row">
        <main role="main" className="col-lg-12 mx-auto" style={{ maxWidth: '1000px' }}>
          <div className="content mx-auto">
            <Row className="g-4">
              <Form.Control
                type="file"
                required
                name="file"
                onChange={handleFileChange}
              />
              <Form.Control 
                onChange={(e) => setName(e.target.value)} 
                size="lg" 
                required 
                type="text" 
                placeholder="Name" 
              />
              <Form.Control 
                onChange={(e) => setDescription(e.target.value)} 
                size="lg" 
                required 
                as="textarea" 
                placeholder="Description" 
              />
              <Form.Control 
                onChange={(e) => setPrice(e.target.value)} 
                size="lg" 
                required 
                type="number" 
                placeholder="Price in ETH" 
              />
              <div className="d-grid px-0">
                <Button onClick={createNFT} variant="primary" size="lg">
                  Create & List NFT!
                </Button>
              </div>
            </Row>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Create;
