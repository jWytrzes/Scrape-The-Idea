import { Injectable } from '@nestjs/common';
import { Article } from './schemas/article.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import fetch from 'node-fetch';

@Injectable()
export class ArticlesService {
    constructor(@InjectModel('Article') private readonly articleModel: Model<Article>) { }

    async findRecent(): Promise<Article[]> {
        const res = await fetch('https://dribbble.com/?page=1&per_page=24');
        const body = await res.text();

        const regex = /var newestShots = ((?:.|\n)*?\}])/m;
        const m = regex.exec(body);
        if (m) {
            let output = m[1].replace(/ {2,}(\w+):/mg, '"$1":');
            output = output.replace(/\'(.*)\'\,/gm, '"$1",');
            let articles = JSON.parse(output);

            articles = await Promise.all(articles.map(async (article) =>
                await this.articleModel.create({
                    createdAt: Date.now(),
                    originSite: 'www.dribbble.com',
                    title: article.title,
                })
            ));

            return articles;
        }

        return [];
    }
};
