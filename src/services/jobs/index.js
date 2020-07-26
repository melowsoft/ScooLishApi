import OrderJob from "./Order";

// This is an array of all jobs
const jobs = [
  OrderJob,
];

/**
 * This is used to cancel all Jobs
 *
 * @export
 */
export default function cancelAll() {
  jobs.forEach(job => job.cancel());
}
