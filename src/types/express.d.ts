export declare global {
    namespace Express {
        interface Request {
            school: {
                id: string;
                email: string;
                name: string;
            };
        }
    }
}