import ReactDOM from 'react-dom';

describe('index', () => {
  it('mounts <App /> into #root', async () => {
    document.body.innerHTML = '<div id="root"></div>';
    const render = vi.spyOn(ReactDOM, 'render').mockImplementation(() => {});
    await import('./index');
    expect(render).toHaveBeenCalledTimes(1);
    const [element, container] = render.mock.calls[0];
    expect(element.type.name).toBe('App');
    expect(container).toBe(document.getElementById('root'));
  });
});
