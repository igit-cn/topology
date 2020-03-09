import { Component, OnInit, OnDestroy } from '@angular/core';

import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { Store } from 'le5le-store';

import { ToolsService } from './tools.service';

@Component({
  selector: 'app-tools',
  templateUrl: './tools.component.html',
  styleUrls: ['./tools.component.scss'],
  providers: [ToolsService]
})
export class ToolsComponent implements OnInit, OnDestroy {
  search = '';
  tab = 1;

  classes: any[];
  tools: any[];

  systemTools: any[] = [];
  userTools: any[] = [];

  search$ = new Subject<string>();
  classes$: any;

  user: any;
  user$: any;
  constructor(private service: ToolsService) {
  }

  async ngOnInit() {
    this.user$ = Store.subscribe('user', (user: any) => {
      this.user = user;
    });

    this.search$
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(text => {
        this.onSearch(text);
      });

    this.classes$ = Store.subscribe('app-classes', (classes: any) => {
      this.classes = classes;
      this.getTools();
    });

    this.tools = await this.service.Get();
    this.getTools();
  }

  getTools() {
    if (!this.classes || !this.tools) {
      return;
    }

    this.systemTools = [];
    this.userTools = [];

    for (const c of this.classes) {
      const system = {
        name: c.name,
        list: [],
        expand: true
      };
      const userTools = {
        name: c.name,
        list: [],
        expand: true
      };
      for (const item of this.tools) {
        if (item.class === c.name) {
          if (item.shared) {
            system.list.push(item);
          }

          if (item.editorId === this.user.id || item.userId === this.user.id) {
            userTools.list.push(item);
          }
        }
      }

      this.systemTools.push(system);
      this.userTools.push(userTools);
    }
  }

  onSearch(text: string) {
    this.filterTools(this.systemTools, text);
    this.filterTools(this.userTools, text);
  }

  filterTools(tools: any[], text: string) {
    for (const group of tools) {
      let found = false;
      for (const item of group.list) {
        item.hidden = false;
        if (!text) {
          found = true;
          continue;
        }
        if (item.name.indexOf(text) > -1 || item.py.indexOf(text) > -1) {
          found = true;
        } else {
          item.hidden = true;
        }
      }

      if (found) {
        group.expand = true;
      } else {
        group.expand = false;
      }
    }
  }

  onDrag(event: DragEvent, node: any) {
    event.dataTransfer.setData('Text', JSON.stringify(node.data));
  }

  onTouchstart(item: any) {
    // this.canvas.touchedNode = item.data;
  }

  ngOnDestroy() {
    this.search$.unsubscribe();
    this.classes$.unsubscribe();
    this.user$.unsubscribe();
  }
}