// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title Digital Waste Transfer Note (DWTN) Contract
 * @dev ISCC-compliant NFT contract for tracking UCO collection chain of custody
 * @author Genesis Reloop Logistics
 */
contract DWTNContract is ERC721, Ownable, Pausable {
    using Counters for Counters.Counter;
    using Strings for uint256;

    Counters.Counter private _tokenIdCounter;

    // DWTN Status enum
    enum DWTNStatus {
        MINTED,        // NFT minted, collection initiated
        IN_TRANSIT,    // UCO being transported
        DELIVERED,     // UCO delivered to processor
        VERIFIED,      // Processor confirmed receipt
        COMPLETED      // Full chain of custody complete
    }

    // DWTN Data Structure
    struct DWTNData {
        string batchId;           // Unique batch identifier
        address origin;           // Restaurant/supplier address
        address collector;        // Driver address
        address processor;        // Biodiesel plant address
        uint256 volume;           // Volume in liters
        uint256 collectionTime;   // Unix timestamp of collection
        uint256 deliveryTime;     // Unix timestamp of delivery
        string collectionGPS;     // GPS coordinates at collection
        string deliveryGPS;       // GPS coordinates at delivery
        string restaurantDetails; // Restaurant information
        string processorDetails;  // Processor information
        DWTNStatus status;        // Current status
        string metadataURI;       // IPFS metadata URI
        bool isVerified;          // Verification status
    }

    // Mapping from token ID to DWTN data
    mapping(uint256 => DWTNData) public dwtnData;
    
    // Mapping from batch ID to token ID
    mapping(string => uint256) public batchToToken;
    
    // Mapping from address to array of token IDs they own
    mapping(address => uint256[]) public ownerTokens;
    
    // Events
    event DWTNMinted(
        uint256 indexed tokenId,
        string batchId,
        address indexed origin,
        address indexed collector,
        uint256 volume
    );
    
    event DWTNStatusUpdated(
        uint256 indexed tokenId,
        DWTNStatus oldStatus,
        DWTNStatus newStatus
    );
    
    event DWTNDelivered(
        uint256 indexed tokenId,
        address indexed processor,
        uint256 deliveryTime
    );
    
    event DWTNVerified(
        uint256 indexed tokenId,
        address indexed processor,
        bool verified
    );

    constructor() ERC721("Digital Waste Transfer Note", "DWTN") {}

    /**
     * @dev Mint a new DWTN NFT
     * @param to The address to mint the NFT to (usually the driver)
     * @param batchId Unique batch identifier
     * @param origin Restaurant/supplier address
     * @param volume Volume in liters
     * @param collectionGPS GPS coordinates at collection
     * @param restaurantDetails Restaurant information
     * @param metadataURI IPFS metadata URI
     */
    function mintDWTN(
        address to,
        string memory batchId,
        address origin,
        uint256 volume,
        string memory collectionGPS,
        string memory restaurantDetails,
        string memory metadataURI
    ) external whenNotPaused returns (uint256) {
        require(bytes(batchId).length > 0, "Batch ID cannot be empty");
        require(origin != address(0), "Origin address cannot be zero");
        require(volume > 0, "Volume must be greater than zero");
        require(batchToToken[batchId] == 0, "Batch ID already exists");

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        DWTNData memory newDWTN = DWTNData({
            batchId: batchId,
            origin: origin,
            collector: to,
            processor: address(0),
            volume: volume,
            collectionTime: block.timestamp,
            deliveryTime: 0,
            collectionGPS: collectionGPS,
            deliveryGPS: "",
            restaurantDetails: restaurantDetails,
            processorDetails: "",
            status: DWTNStatus.MINTED,
            metadataURI: metadataURI,
            isVerified: false
        });

        dwtnData[tokenId] = newDWTN;
        batchToToken[batchId] = tokenId;
        ownerTokens[to].push(tokenId);

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);

        emit DWTNMinted(tokenId, batchId, origin, to, volume);
        return tokenId;
    }

    /**
     * @dev Update DWTN status (only by collector or processor)
     * @param tokenId The token ID to update
     * @param newStatus The new status
     */
    function updateStatus(uint256 tokenId, DWTNStatus newStatus) external {
        require(_exists(tokenId), "Token does not exist");
        require(
            msg.sender == ownerOf(tokenId) || msg.sender == dwtnData[tokenId].processor,
            "Not authorized to update status"
        );

        DWTNStatus oldStatus = dwtnData[tokenId].status;
        dwtnData[tokenId].status = newStatus;

        emit DWTNStatusUpdated(tokenId, oldStatus, newStatus);
    }

    /**
     * @dev Record delivery to processor
     * @param tokenId The token ID
     * @param processor Processor address
     * @param deliveryGPS GPS coordinates at delivery
     * @param processorDetails Processor information
     */
    function recordDelivery(
        uint256 tokenId,
        address processor,
        string memory deliveryGPS,
        string memory processorDetails
    ) external {
        require(_exists(tokenId), "Token does not exist");
        require(msg.sender == ownerOf(tokenId), "Not the token owner");
        require(processor != address(0), "Processor address cannot be zero");

        DWTNData storage dwtn = dwtnData[tokenId];
        dwtn.processor = processor;
        dwtn.deliveryTime = block.timestamp;
        dwtn.deliveryGPS = deliveryGPS;
        dwtn.processorDetails = processorDetails;
        dwtn.status = DWTNStatus.DELIVERED;

        emit DWTNDelivered(tokenId, processor, block.timestamp);
    }

    /**
     * @dev Verify DWTN by processor
     * @param tokenId The token ID
     * @param verified Verification status
     */
    function verifyDWTN(uint256 tokenId, bool verified) external {
        require(_exists(tokenId), "Token does not exist");
        require(
            msg.sender == dwtnData[tokenId].processor,
            "Only processor can verify"
        );

        dwtnData[tokenId].isVerified = verified;
        if (verified) {
            dwtnData[tokenId].status = DWTNStatus.VERIFIED;
        }

        emit DWTNVerified(tokenId, msg.sender, verified);
    }

    /**
     * @dev Get DWTN data by token ID
     * @param tokenId The token ID
     * @return DWTN data structure
     */
    function getDWTNData(uint256 tokenId) external view returns (DWTNData memory) {
        require(_exists(tokenId), "Token does not exist");
        return dwtnData[tokenId];
    }

    /**
     * @dev Get DWTN data by batch ID
     * @param batchId The batch ID
     * @return DWTN data structure
     */
    function getDWTNByBatch(string memory batchId) external view returns (DWTNData memory) {
        uint256 tokenId = batchToToken[batchId];
        require(tokenId > 0, "Batch not found");
        return dwtnData[tokenId];
    }

    /**
     * @dev Get all tokens owned by an address
     * @param owner The owner address
     * @return Array of token IDs
     */
    function getTokensByOwner(address owner) external view returns (uint256[] memory) {
        return ownerTokens[owner];
    }

    /**
     * @dev Get tokens by status
     * @param status The status to filter by
     * @return Array of token IDs with the specified status
     */
    function getTokensByStatus(DWTNStatus status) external view returns (uint256[] memory) {
        uint256[] memory result = new uint256[](_tokenIdCounter.current());
        uint256 count = 0;
        
        for (uint256 i = 0; i < _tokenIdCounter.current(); i++) {
            if (dwtnData[i].status == status) {
                result[count] = i;
                count++;
            }
        }
        
        // Resize array to actual count
        uint256[] memory finalResult = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            finalResult[i] = result[i];
        }
        
        return finalResult;
    }

    /**
     * @dev Override tokenURI to return metadata URI
     * @param tokenId The token ID
     * @return The metadata URI
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        return dwtnData[tokenId].metadataURI;
    }

    /**
     * @dev Set token URI (internal function)
     * @param tokenId The token ID
     * @param uri The metadata URI
     */
    function _setTokenURI(uint256 tokenId, string memory uri) internal {
        dwtnData[tokenId].metadataURI = uri;
    }

    /**
     * @dev Pause contract (only owner)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause contract (only owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Override _beforeTokenTransfer to handle owner tokens array
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override {
        super._beforeTokenTransfer(from, to, tokenId);
        
        if (from != address(0)) {
            // Remove from sender's tokens
            uint256[] storage senderTokens = ownerTokens[from];
            for (uint256 i = 0; i < senderTokens.length; i++) {
                if (senderTokens[i] == tokenId) {
                    senderTokens[i] = senderTokens[senderTokens.length - 1];
                    senderTokens.pop();
                    break;
                }
            }
        }
        
        if (to != address(0)) {
            // Add to receiver's tokens
            ownerTokens[to].push(tokenId);
        }
    }

    /**
     * @dev Get total number of minted tokens
     * @return Total token count
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter.current();
    }
}
