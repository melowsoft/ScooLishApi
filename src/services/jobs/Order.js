import Schedule from "node-schedule";
import { updateOrderStages } from "../../api/order/controller";

export default Schedule.scheduleJob({ minute: 0, second: 0 }, async (date) => {
  console.log("Order job started at", date);
  await updateOrderStages();
});
