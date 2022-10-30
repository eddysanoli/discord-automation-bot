/* ============================================ */
/* EC2 INSTANCE                                 */
/* ============================================ */

/**
 * Object that contains different details about an AWS EC2 instance,
 * such as the instance ID, type, state, etc. 
 * 
 * @typedef EC2Instance 
 * @type {Object}
 * 
 * @property {string} id
 * ID of the EC2 instance 
 * 
 * @property {string} name 
 * Name / label that the user assigned to the EC2 instance 
 * 
 * @property {string | "running" | "stopped" | "terminated"} status
 * Status of the EC2 instance. Possible values are: running, stopped
 * and terminated (more are available but I didn't include them)
 * 
 * @property {string} ipv4
 * IPv4 address of the EC2 instance
 * 
 * @property {string} ipv6
 * IPv6 address of the EC2 instance
 */
export type EC2Instance = {
    id: string,
    name: string,
    status: string | "running" | "stopped" | "terminated",
    ipv4: string,
    ipv6: string
}