import { override } from '@microsoft/decorators';
import { Log } from '@microsoft/sp-core-library';
import {
  BaseApplicationCustomizer
} from '@microsoft/sp-application-base';
import { Dialog } from '@microsoft/sp-dialog';

import * as strings from 'SpviewApplicationCustomizerStrings';
import { SPHttpClient, SPHttpClientResponse, ISPHttpClientOptions } from '@microsoft/sp-http';
import { IODataList } from '@microsoft/sp-odata-types';
import { IListItem } from './ListItem';
import { SPList, SPListItem } from '@microsoft/sp-page-context';

const LOG_SOURCE: string = 'SpviewApplicationCustomizer';

/**
 * If your command set uses the ClientSideComponentProperties JSON input,
 * it will be deserialized into the BaseExtension.properties object.
 * You can define an interface to describe it.
 */
export interface ISpviewApplicationCustomizerProperties {
  // This is an example; replace with your own property
  testMessage: string;
}

/** A Custom Action which can be run during execution of a Client Side Application */
export default class SpviewApplicationCustomizer
  extends BaseApplicationCustomizer<ISpviewApplicationCustomizerProperties> {
  public lists: Array<IListItem> = [];
  public origlists: Array<any> = [];
  private fetchLists() {
    let url = this.context.pageContext.web.absoluteUrl + `/_api/web/lists/GetByTitle('views')/items`;
    return this.context.spHttpClient.get(url, SPHttpClient.configurations.v1).then((response: SPHttpClientResponse) => {
      if (response.ok) {
        return response.json();
      } else {
        console.log("WARNING - failed to hit URL " + url + ". Error = " + response.statusText);
        return null;
      }
    }).then((r => {
      console.log(r.value);
      r.value.forEach(el => {
        this.lists.push({ id: el.Title, counter: el.f67l });
        this.origlists.push(el);
      });
    })).then(() => console.log(this.lists)).then(() => this.checkUrl());
  }

  // private fetchOptions(): Promise<any[]> {
  //   return this.fetchLists().then((response) => {
  //     var options: Array<any> = new Array<any>();
  //     response.value.map((list: IODataList) => {
  //       console.log("Found list with title = " + list.Title);
  //       options.push({ key: list.Id, text: list.Title });
  //     });
  //     return options;
  //   });
  // }
  private addui(counter: number){
    let parentdiv = document.getElementsByClassName('ms-OverflowSet ms-CommandBar-primaryCommand')[0];
    let newelem = document.createElement('div');
    newelem.setAttribute('class','ms-OverflowSet-item');
    newelem.innerHTML = `<i data-icon-name="Settings" role="presentation" aria-hidden="true" class="ms-Button-icon">${counter}</i><button title='Количество просмотров страницы'class='ms-Button-textContainer textContainer-102'>${counter}</button>`;
    parentdiv.appendChild(newelem);
    console.log(parentdiv);
  }
  private addItem() {
    let url = this.context.pageContext.web.absoluteUrl + `/_api/web/lists/GetByTitle('views')/items`;
    const options: ISPHttpClientOptions = {
      body: JSON.stringify({
        Title: this.context.pageContext.web.absoluteUrl,
        f67l: 1
      })
    };
    return this.context.spHttpClient.post(url, SPHttpClient.configurations.v1, options).then(response => {
      return response.json();
    });
  }
  private updateItem(id: number) {
    let url = this.context.pageContext.web.absoluteUrl + `/_api/web/lists/GetByTitle('views')/items(${id})`;
    let elem = this.origlists.filter(l => l.Id === id);
    console.log(elem[0].f67l);
    const options = {
      headers: {
        'Accept': "application/json;odata=nometadata",
        'Content-type': "application/json;odata=nometadata",
        'odata-version': '',
        'IF-MATCH': '*',
        'X-HTTP-Method': 'MERGE'
      },
      body: JSON.stringify({
        // "__metadata": { "type": "SP.Data.ViewsListListItem" }, // <-- имя сущности
        // 'Title': 'POMENYAL', // <-- "Имя поля": "Значение"
        'f67l': elem[0].f67l + 1
      })
    };
    return this.context.spHttpClient.post(url, SPHttpClient.configurations.v1, options).then(response => {
      return response.json();
    });
  }
  private checkUrl() {
    let newlists = this.origlists.filter(item => item.Title === this.context.pageContext.web.absoluteUrl);
    console.log(newlists);
    if (newlists.length !== 0) {
      console.log(newlists[0].Id);
      this.updateItem(newlists[0].Id);
      this.addui(newlists[0].f67l);
    } else {
      this.addItem();
      this.addui(0);
    }
  }
  @override
  public onInit(): Promise<void> {
    Log.info(LOG_SOURCE, `Initialized ${strings.Title}`);
    console.log(this.fetchLists());
    
    // this.checkUrl();
    // console.log(this.addItem());
    // console.log(this.updateItem());
    // console.log(this.lists);
    let message: string = this.properties.testMessage;
    if (!message) {
      message = '(No properties were provided.)';
    }

    Dialog.alert(`Hello from ${strings.Title}:\n\n${message}`);

    return Promise.resolve();
  }
}
