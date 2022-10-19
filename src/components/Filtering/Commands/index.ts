import { TagFilter } from './TagFilter';
import { ScoreFilter } from './ScoreFilter';
import { FilterCommand } from '../Filter';
import { OpenFilter } from './OpenFilter';
import { CommentFilter } from './CommentFilter';

const filters: FilterCommand[] = [
    new TagFilter(),
    new ScoreFilter(),
    new OpenFilter(),
    new CommentFilter()
];

export default filters;