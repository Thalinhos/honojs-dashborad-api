
import bcrypt from "bcrypt";
import { getSessionCollection, getUserCollection } from "../../db/db.js";

const users = [
    { name: "admin", email: "admin@hotmail.com", password: process.env.ADMINPASS }
];

export async function seedUsers() {
    const usersCollection = await getUserCollection();
    await usersCollection.createIndex({ email: 1 });

    const sessionsCollection = await getSessionCollection();
    await sessionsCollection.createIndex({ "createdAt": 1 }, { expireAfterSeconds: 86400 })


    try {
        for (const user of users) {
            const existingUsers = await usersCollection.find({ name: user.name }).toArray();

            if (existingUsers.length > 0) {
                console.log(`User '${user.name}' already exists. Skipping seeding.`);
                return;
            }


            const hashedPassword = await bcrypt.hash(user.password as any, 10);
            if (!hashedPassword) {
                console.error(`Failed to hash password for user '${user.name}'.`);
                continue;
            }
            const userToAdd = {
                name: user.name,
                email: user.email,
                password: hashedPassword
            };

            const result = await usersCollection.insertOne(userToAdd);
            console.log(`Inserted user '${user.name}' with ID: ${result.insertedId}`);
        }
        return true
    } catch (error) {
        console.error("Error seeding users:", error);
        return false
    }
}
