import * as express from "express"
import * as cors from "cors"
import {Request, Response} from "express";
import {createConnection} from "typeorm";
import "reflect-metadata"; 
import * as amqp from "amqplib/callback_api"
import { Product } from "./entity/product";

createConnection().then( db => {
    const productRepository = db.getMongoRepository(Product)
    amqp.connect('amqps://uvevpcnn:l0XW3Rqe5b6Tz2avj3tqxZSDB_sCRTRI@toad.rmq.cloudamqp.com/uvevpcnn', (err, connection)=>{
        if(err) throw err

        connection.createChannel((error, channel) => {
            if (error) throw error
            
            channel.assertQueue('productCreated', {durable: false})
            

            const app = express();
            app.use(cors({
                origin: ['http://localhost:3000', 'http://localhost:8000', 'http://localhost:4200']
            }))

            app.use(express.json());

            channel.consume('productCreated', async (message) => {
                const receivedProducts = message.content.toString();
                // console.log(receivedProducts);
                
                const eventProducts:Product = JSON.parse(receivedProducts);
                const product = new Product();
                Object.assign(product , {...eventProducts, admin_product_id: eventProducts.id})

                const savedProduct = await productRepository.save(product);
                console.log(savedProduct);
                

                channel.ack(message);
            }, { noAck: false })

            app.listen(8001, ()=>{
                console.log("Server is running on port 8001");
            })
            process.on('beforeExit', () => {
                console.log('closing the connection');
                connection.close();
            })
        })
    })

    

})