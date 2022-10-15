import { TagFilter } from './TagFilter';
import { ScoreFilter } from './ScoreFilter';
import { FilterCommand } from '../Filter';
import { OpenFilter } from './OpenFilter';

const filters: FilterCommand[] = [
    new TagFilter(),
    new ScoreFilter(),
    new OpenFilter()
];

export default filters;