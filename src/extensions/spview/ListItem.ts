export interface IListItem{
    id:string;
    counter:number;
  }
export class ListItem {
    public id: string;
    public counter: number;
    constructor(item: IListItem) {
        this.id = item.id;
        this.counter = item.counter;
    }
}