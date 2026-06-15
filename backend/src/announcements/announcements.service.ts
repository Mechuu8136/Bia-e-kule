import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Announcement } from './announcement.entity';

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectRepository(Announcement)
    private readonly repository: Repository<Announcement>,
  ) {}

  findPublished(): Promise<Announcement[]> {
    return this.repository.find({
      where: { is_published: true },
      order: { published_at: 'DESC' },
    });
  }

  findAll(): Promise<Announcement[]> {
    return this.repository.find({ order: { published_at: 'DESC' } });
  }

  async create(title: string, body: string, isPublished = true): Promise<Announcement> {
    const announcement = this.repository.create({
      title,
      body,
      is_published: isPublished,
    });
    return this.repository.save(announcement);
  }

  async delete(id: string): Promise<void> {
    const result = await this.repository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Ogłoszenie nie zostało znalezione');
    }
  }
}
