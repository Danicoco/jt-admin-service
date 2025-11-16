const { jsonS, jsonFailed } = require("../../../utils");
const {
  listShipments,
  getShipment,
  createShipment,
  updateShipment,
  deleteShipment,
  getMetrics,
} = require("../../../services/shippingService");
const {
  fetchAddresses,
  addAddresses,
  updateAddresses,
  getCryptoTransactions,
  getGiftCardSellRequest,
  getTradeChart,
  getTradeMetrics,
  processGiftCardSellRequest,
  getCardMetrics,
} = require("../../../services/userService");

const Controller = {
  listCryptoTrans: async (req, res) => {
    const { giftcard, cryptoType, coin } = req.query;
    try {
      const trans = await getCryptoTransactions(cryptoType, coin, giftcard);
      return jsonS(res, 200, "Crypto Transaction fetched", trans);
    } catch (err) {
      console.error("Error fetching crypto transaction:", err);
      return jsonFailed(res, {}, "Cannot fetch crypto transaction", 500);
    }
  },
  metrics: async (req, res) => {
    try {
      const trans = await Promise.all([
        getTradeMetrics(),
        getCardMetrics()
      ])
      return jsonS(res, 200, "Crypto Transaction fetched", trans);
    } catch (err) {
      console.error("Error fetching crypto transaction:", err);
      return jsonFailed(res, {}, "Cannot fetch crypto transaction", 500);
    }
  },
  chart: async (req, res) => {
    try {
      const trans = await getTradeChart();
      return jsonS(res, 200, "Crypto Transaction fetched", trans);
    } catch (err) {
      console.error("Error fetching crypto transaction:", err);
      return jsonFailed(res, {}, "Cannot fetch crypto transaction", 500);
    }
  },
  giftCardRequest: async (req, res) => {
    const { status } = req.query;
    try {
      const trans = await getGiftCardSellRequest(status);
      return jsonS(res, 200, "Gift card request fetched", trans);
    } catch (err) {
      console.error("Error fetching crypto transaction:", err);
      return jsonFailed(res, {}, "Cannot fetch crypto transaction", 500);
    }
  },
  processGiftCard: async (req, res) => {
    const { id } = req.params;
    const { status, reason } = req.body;
    try {
      const trans = await processGiftCardSellRequest(id, { status, reason });
      return jsonS(res, 200, "Gift card request fetched", trans);
    } catch (err) {
      console.error("Error fetching crypto transaction:", err);
      return jsonFailed(res, {}, "Cannot fetch crypto transaction", 500);
    }
  },
};

module.exports = Controller;
