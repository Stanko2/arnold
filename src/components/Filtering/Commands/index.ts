import { TagFilter } from './TagFilter';
import { ScoreFilter } from './ScoreFilter';
import { FilterCommand } from '../Filter';

const filters: FilterCommand[] = [
    new TagFilter(),
    new ScoreFilter(),
];

export default filters;