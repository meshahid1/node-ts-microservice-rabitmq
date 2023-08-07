import * as express from "express";
import {Request, Response} from "express";
import * as cors from "cors";
import {createConnection} from "typeorm";
import "reflect-metadata"
import { Product } from "./entity/product";
import * as amqp from "amqplib/callback_api"
import { addAbortSignal } from "stream";

createConnection().then( db => {
    const productRepository = db.getRepository(Product) 

    amqp.connect('amqps://uvevpcnn:l0XW3Rqe5b6Tz2avj3tqxZSDB_sCRTRI@toad.rmq.cloudamqp.com/uvevpcnn', (err, connection)=>{
        if(err) throw err

        connection.createChannel((error, channel) => {
            if (error) throw error

            channel.assertQueue('productQueue', {durable: false})
            const app = express();
            app.use(cors({
                origin: ['http://localhost:3000', 'http://localhost:8000', 'http://localhost:4200']
            }))
            
        
            app.use(express.json());
        
            app.get('/api/getProducts', async (req: Request, res: Response) => {
                const products = await productRepository.find();
                channel.sendToQueue('productQueue', Buffer.from(JSON.stringify(products)))
                res.json(products);
            })
            app.post('/api/insertProduct', async (req: Request, res: Response) => {
                const product = await productRepository.create(req.body);
                const result = await productRepository.save(product);
                channel.sendToQueue('productCreated', Buffer.from(JSON.stringify(result)))
                res.json(result);
            })
            app.get('/api/getProduct/:product_id', async (req: Request, res: Response) => {
                const {product_id} = req.params;
                const product = await productRepository.findOneBy({
                    id: parseInt(product_id)
                });
                channel.sendToQueue('product', Buffer.from(JSON.stringify(product)))
                res.json(product);
            })
            app.put('/api/updateProduct/:product_id', async (req: Request, res: Response) => {
                const {product_id} = req.params;
                const product = await productRepository.findOneBy({
                    id: parseInt(product_id)
                });
                productRepository.merge(product, req.body)
                const result = await productRepository.save(product);
                channel.sendToQueue('productUpdate', Buffer.from(JSON.stringify(result)))
                res.json(result);
            })
            app.delete('/api/deleteProduct/:product_id', async (req: Request, res: Response) => {
                const {product_id} = req.params;
                let prod = await productRepository.delete(product_id);
                channel.sendToQueue('productDelete', Buffer.from(JSON.stringify(product_id)))
                res.json(prod)
            })
            app.post('/api/product/:product_id/like', async (req: Request, res: Response) => {
                const {product_id} = req.params;
                const product = await productRepository.findOneBy({
                    id: parseInt(product_id)
                });
                product.like++;
                const result = await productRepository.save(product);
                channel.sendToQueue('productLike', Buffer.from(JSON.stringify(result)))
                res.json(result);
            })
        
            app.listen(8080, ()=>{
                console.log("Server is running on port 8080");
            })
            process.on('beforeExit', () => {
                console.log('closing the connection');
                connection.close();
            })


        })
    })

   
})


